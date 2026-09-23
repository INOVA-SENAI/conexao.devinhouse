/**
 * Conexão DevInHouse — API do site de networking.
 *
 * COMO SUBIR
 * 1. Crie uma planilha nova e abra Extensões > Apps Script. Cole este arquivo.
 * 2. Crie no Drive uma pasta só para as fotos e cole o id dela em PASTA (o id é o
 *    trecho da URL depois de /folders/).
 * 3. Rode criarAbas() uma vez e depois teste(). As duas têm que terminar sem erro.
 * 4. Implantar > Nova implantação > App da Web:
 *      Executar como: eu   |   Quem tem acesso: qualquer pessoa
 *    Copie a URL que termina em /exec e cole na constante API do index.html.
 * 5. AO MUDAR ESTE CÓDIGO: Gerenciar implantações > lápis > Versão: Nova versão.
 *    Não crie outra implantação: isso muda a URL /exec e derruba o site.
 * 6. Para travar o site na marra, sem novo deploy: Configurações do projeto >
 *    Propriedades do script > FECHADO = 1.
 */

const PASTA = 'COLE_AQUI_O_ID_DA_PASTA_DE_FOTOS';

const ABAS = {
  participantes: ['id', 'criado_em', 'nome', 'unidade', 'bio', 'linkedin', 'github', 'instagram', 'avatar', 'token_hash', 'oculto'],
  mural: ['id', 'criado_em', 'autor_id', 'texto', 'oculto'],
  recados: ['id', 'criado_em', 'para_id', 'autor_id', 'texto', 'oculto'],
};
const REDES = ['linkedin', 'github', 'instagram'];
const MAX = { nome: 60, unidade: 40, bio: 160, texto: 280, foto: 200 * 1024 };
const CADASTROS_POR_MINUTO = 40;

// ---------- entrada ----------

function doGet() {
  const cache = CacheService.getScriptCache();
  let json = cache.get('lista');
  if (!json) {
    json = JSON.stringify(lista());
    // ponytail: o cache do Apps Script guarda no máximo 100KB. Passou disso, segue sem cache.
    try { cache.put('lista', json, 10); } catch (e) {}
  }
  return resposta(json);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.website) return resposta(JSON.stringify({ ok: true })); // honeypot: bot preencheu campo escondido
    lock.waitLock(20000);
    const r = acao(d);
    CacheService.getScriptCache().remove('lista');
    return resposta(JSON.stringify(r));
  } catch (err) {
    if (!err.amigavel) console.error(err);
    const msg = err.amigavel ? err.message : 'Não consegui salvar agora. Tente de novo.';
    return resposta(JSON.stringify({ ok: false, erro: msg }));
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function acao(d) {
  if (PropertiesService.getScriptProperties().getProperty('FECHADO')) {
    throw amigavel('O site está fechado para novas publicações.');
  }
  switch (d.a) {
    case 'cadastrar': return cadastrar(d);
    case 'editar': return editar(d);
    case 'apagar': return apagar(d);
    case 'mural': return comentar(d, 'mural');
    case 'recado': return comentar(d, 'recados');
  }
  throw amigavel('Ação desconhecida.');
}

// ---------- leitura ----------

function lista() {
  const visiveis = nome => linhas(nome).filter(r => !String(r.oculto).trim());
  return {
    ok: true,
    participantes: visiveis('participantes').map(r => ({
      id: r.id, nome: r.nome, unidade: r.unidade, bio: r.bio,
      linkedin: r.linkedin, github: r.github, instagram: r.instagram, avatar: r.avatar,
    })),
    mural: visiveis('mural').slice(-300).map(r => ({ id: r.id, em: r.criado_em, autor: r.autor_id, texto: r.texto })),
    recados: visiveis('recados').map(r => ({ id: r.id, em: r.criado_em, para: r.para_id, autor: r.autor_id, texto: r.texto })),
  };
}

// ---------- escrita ----------

function cadastrar(d) {
  tetoDeCadastros();
  const f = campos(d);
  const id = novoId();
  const token = Utilities.getUuid();
  aba('participantes').appendRow([
    id, new Date(), f.nome, f.unidade, f.bio, f.linkedin, f.github, f.instagram,
    d.foto ? salvaFoto(d.foto) : '', sha(token), '',
  ]);
  return { ok: true, id: id, token: token };
}

function editar(d) {
  const eu = dono(d.token);
  espera(d.token);
  const f = campos(d);
  let avatar = eu.avatar;
  if (d.foto) {
    avatar = salvaFoto(d.foto);
    apagaFoto(eu.avatar);
  } else if (d.removerFoto) {
    apagaFoto(eu.avatar);
    avatar = '';
  }
  // colunas 3 a 9: nome, unidade, bio, linkedin, github, instagram, avatar
  aba('participantes').getRange(eu._linha, 3, 1, 7)
    .setValues([[f.nome, f.unidade, f.bio, f.linkedin, f.github, f.instagram, avatar]]);
  return { ok: true, id: eu.id };
}

function apagar(d) {
  const eu = dono(d.token);
  apagaFoto(eu.avatar);
  aba('participantes').deleteRow(eu._linha);
  apagaLinhas('mural', 'autor_id', eu.id);
  apagaLinhas('recados', 'autor_id', eu.id);
  apagaLinhas('recados', 'para_id', eu.id);
  return { ok: true };
}

function comentar(d, onde) {
  const eu = dono(d.token);
  espera(d.token);
  const texto = limpa(d.texto, MAX.texto);
  if (!texto) throw amigavel('Escreva alguma coisa.');
  if (onde === 'mural') {
    aba('mural').appendRow([novoId(), new Date(), eu.id, texto, '']);
  } else {
    const para = String(d.para || '');
    if (!linhas('participantes').some(r => r.id === para)) throw amigavel('Não achei essa pessoa.');
    aba('recados').appendRow([novoId(), new Date(), para, eu.id, texto, '']);
  }
  return { ok: true };
}

// ---------- validação ----------

function campos(d) {
  const f = {
    nome: limpa(d.nome, MAX.nome),
    unidade: limpa(d.unidade, MAX.unidade),
    bio: limpa(d.bio, MAX.bio),
  };
  if (!f.nome) throw amigavel('Escreva seu nome.');
  REDES.forEach(r => { f[r] = handle(d[r]); });
  return f;
}

/** Tira caracteres de controle, corta no tamanho e desarma fórmula do Sheets. */
function limpa(v, max) {
  const s = String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Aceita URL colada, @arroba ou o handle puro. Devolve '' se não for um handle válido. */
function handle(v) {
  const h = String(v || '').trim().split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop().replace(/^@/, '');
  return /^[A-Za-z0-9._-]{1,100}$/.test(h) ? h : '';
}

/** Bytes do Apps Script são com sinal: FF D8 FF vira -1 -40 -1. */
function ehJpeg(bytes) {
  return bytes.length > 3 && bytes[0] === -1 && bytes[1] === -40 && bytes[2] === -1;
}

// ---------- foto ----------

function salvaFoto(base64) {
  const bytes = Utilities.base64Decode(String(base64).replace(/^data:[^,]+,/, ''));
  if (bytes.length > MAX.foto) throw amigavel('Essa foto é grande demais.');
  if (!ehJpeg(bytes)) throw amigavel('Envie uma imagem.');
  const arquivo = DriveApp.getFolderById(PASTA)
    .createFile(Utilities.newBlob(bytes, 'image/jpeg', novoId() + '.jpg'));
  arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return arquivo.getId();
}

function apagaFoto(id) {
  if (!id) return;
  try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { console.error(e); }
}

// ---------- antiabuso ----------

function espera(token) {
  const cache = CacheService.getScriptCache();
  const chave = 'rl' + sha(String(token));
  if (cache.get(chave)) throw amigavel('Calma aí, espere uns segundos.');
  cache.put(chave, '1', 5);
}

function tetoDeCadastros() {
  const cache = CacheService.getScriptCache();
  const chave = 'cad' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(chave) || 0) + 1;
  if (n > CADASTROS_POR_MINUTO) throw amigavel('Muita gente cadastrando agora. Tente de novo em um minuto.');
  cache.put(chave, String(n), 120); // ponytail: contador sem transação, erra por pouco sob corrida. Basta para segurar bot.
}

// ---------- planilha ----------

function aba(nome) {
  return SpreadsheetApp.getActive().getSheetByName(nome);
}

function linhas(nome) {
  const cols = ABAS[nome];
  return aba(nome).getDataRange().getValues().slice(1).map((linha, i) => {
    const o = { _linha: i + 2 };
    cols.forEach((c, j) => { o[c] = linha[j]; });
    return o;
  });
}

function apagaLinhas(nome, coluna, valor) {
  const sh = aba(nome);
  linhas(nome).filter(r => r[coluna] === valor).map(r => r._linha).reverse().forEach(n => sh.deleteRow(n));
}

function dono(token) {
  const h = sha(String(token || ''));
  const eu = linhas('participantes').filter(r => r.token_hash === h)[0];
  if (!eu) throw amigavel('Não achei seu cartão neste celular. Crie um novo.');
  return eu;
}

// ---------- utilidades ----------

function novoId() {
  return 'c' + Utilities.getUuid().slice(0, 7); // começa com letra para o Sheets não tratar como número
}

function sha(txt) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, txt, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join(''); // hex, não base64: base64 pode começar com + ou =
}

function amigavel(msg) {
  const e = new Error(msg);
  e.amigavel = true;
  return e;
}

function resposta(json) {
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// ---------- setup e teste ----------

function criarAbas() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(ABAS).forEach(nome => {
    const sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    sh.getRange(1, 1, 1, ABAS[nome].length).setValues([ABAS[nome]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
}

function teste() {
  const ok = (cond, msg) => { if (!cond) throw new Error('FALHOU: ' + msg); };

  ok(handle('https://www.linkedin.com/in/fulano/?utm=x') === 'fulano', 'url do linkedin');
  ok(handle('instagram.com/beltrano/') === 'beltrano', 'url com barra no fim');
  ok(handle('@joao') === 'joao', 'arroba');
  ok(handle('  sicrano ') === 'sicrano', 'espaços');
  ok(handle('javascript:alert(1)') === '', 'link perigoso');
  ok(handle('') === '', 'vazio');

  ok(limpa('=1+1', 20) === "'=1+1", 'fórmula');
  ok(limpa('@todos', 20) === "'@todos", 'arroba vira texto');
  ok(limpa('  oi  ', 20) === 'oi', 'trim');
  ok(limpa('abcdefghij', 3) === 'abc', 'corte no tamanho');
  ok(limpa(null, 10) === '', 'nulo');

  ok(ehJpeg([-1, -40, -1, -32]), 'jpeg de verdade');
  ok(!ehJpeg([60, 104, 116, 109]), 'html renomeado para .jpg');
  ok(!ehJpeg([-1, -40]), 'arquivo truncado');

  ok(sha('abc').length === 64 && /^[0-9a-f]+$/.test(sha('abc')), 'hash em hex');

  Logger.log('tudo ok');
}
