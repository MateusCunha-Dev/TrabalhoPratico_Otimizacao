// Cores para as restrições no gráfico
const COLORS = ['#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#FFC107', '#795548'];

/* ========== FUNÇÕES DE PARSE/ANÁLISE ========== */

// Função para parsear uma restrição em partes componentes
function parseRestricao(str) {
  const match = str.match(/([-+*/xXyY0-9 .]+)(<=|>=|=|<|>)(.+)/);
  if (!match) return null;
  
  return {
    lhs: match[1].trim(),
    op: match[2],
    rhs: parseFloat(match[3].trim())
  };
}

// Função para extrair coeficientes de uma expressão linear
function extrairCoeficientes(expr) {
  const regex = /([+-]?\s*\d*\.?\d*)\s*([xy])/gi;
  let result = { x: 0, y: 0 };
  let m;
  
  // Casos especiais para quando há apenas x ou y
  if (expr.trim() === 'x') return { x: 1, y: 0 };
  if (expr.trim() === 'y') return { x: 0, y: 1 };
  
  while ((m = regex.exec(expr)) !== null) {
    let coef = m[1].replace(/\s+/g, '');
    if (coef === '' || coef === '+') coef = '1';
    if (coef === '-') coef = '-1';
    result[m[2].toLowerCase()] = parseFloat(coef);
  }
  return result;
}

/* ========== FUNÇÕES DE VALIDAÇÃO ========== */

// Verifica se um ponto (x,y) satisfaz todas as restrições
function pontoValido(x, y, restricoes) {
  return restricoes.every(r => {
    const { x: cx, y: cy } = extrairCoeficientes(r.lhs);
    const valor = cx * x + cy * y;
    
    switch (r.op) {
      case '<=': return valor <= r.rhs + 1e-6;
      case '>=': return valor >= r.rhs - 1e-6;
      case '=': return Math.abs(valor - r.rhs) < 1e-6;
      case '<': return valor < r.rhs + 1e-6;
      case '>': return valor > r.rhs - 1e-6;
      default: return false;
    }
  });
}

/* ========== FUNÇÕES DE CÁLCULO ========== */

// Encontra todos os vértices viáveis do problema (VERSÃO MELHORADA)
function encontrarVertices(restricoes) {
  let vertices = [];
  
  // 1. Adiciona a origem (0,0) se for viável
  if (pontoValido(0, 0, restricoes)) {
    vertices.push({ x: 0, y: 0 });
  }

  // 2. Interseções com os eixos X e Y
  restricoes.forEach(r => {
    const { x: a, y: b } = extrairCoeficientes(r.lhs);
    const c = r.rhs;
    
    // Interseção com eixo X (y=0)
    if (a !== 0) {
      const x = c / a;
      if (pontoValido(x, 0, restricoes)) {
        vertices.push({ x, y: 0 });
      }
    }
    
    // Interseção com eixo Y (x=0)
    if (b !== 0) {
      const y = c / b;
      if (pontoValido(0, y, restricoes)) {
        vertices.push({ x: 0, y });
      }
    }
  });
  
  // 3. Interseções entre todas as combinações de restrições
  for (let i = 0; i < restricoes.length; i++) {
    for (let j = i + 1; j < restricoes.length; j++) {
      const r1 = restricoes[i];
      const r2 = restricoes[j];
      
      const { x: a1, y: b1 } = extrairCoeficientes(r1.lhs);
      const c1 = r1.rhs;
      const { x: a2, y: b2 } = extrairCoeficientes(r2.lhs);
      const c2 = r2.rhs;
      
      const det = a1 * b2 - a2 * b1;
      
      if (Math.abs(det) > 1e-6) { // Evita divisão por zero
        const x = (c1 * b2 - c2 * b1) / det;
        const y = (a1 * c2 - a2 * c1) / det;
        
        if (pontoValido(x, y, restricoes)) {
          vertices.push({ x, y });
        }
      }
    }
  }
  
  // 4. Adiciona pontos nos limites do gráfico quando o problema é ilimitado
  const pontosExtras = [
    { x: 0, y: 15 }, { x: 15, y: 0 }, { x: 15, y: 15 }
  ];
  
  pontosExtras.forEach(p => {
    if (pontoValido(p.x, p.y, restricoes) && 
        !vertices.some(v => Math.abs(v.x - p.x) < 1e-6 && Math.abs(v.y - p.y) < 1e-6)) {
      vertices.push(p);
    }
  });

  // Remove vértices duplicados
  return vertices.filter((v, i) => 
    !vertices.some((w, j) => j < i && 
      Math.abs(v.x - w.x) < 1e-6 && 
      Math.abs(v.y - w.y) < 1e-6)
  );
}

/* ========== FUNÇÕES DE DESENHO DO GRÁFICO ========== */

// Desenha o gráfico com as restrições e solução (VERSÃO MELHORADA)
function desenharGrafico(objetivo, restricoes, solucao) {
  const canvas = document.getElementById('grafico');
  const ctx = canvas.getContext('2d');
  
  // Limpa o canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Configurações
  const padding = 50;
  const scale = 25;
  
  // Funções de conversão de coordenadas
  const toPixelX = (x) => padding + x * scale;
  const toPixelY = (y) => canvas.height - padding - y * scale;

  // Desenhar eixos
  ctx.beginPath();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  
  // Eixo X
  ctx.moveTo(toPixelX(0), toPixelY(0));
  ctx.lineTo(toPixelX(15), toPixelY(0));
  
  // Eixo Y
  ctx.moveTo(toPixelX(0), toPixelY(0));
  ctx.lineTo(toPixelX(0), toPixelY(15));
  
  // Marcadores e rótulos dos eixos
  ctx.font = '12px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  
  for (let i = 0; i <= 15; i += 1) {
    // Marcadores do eixo X
    ctx.moveTo(toPixelX(i), toPixelY(0) - 3);
    ctx.lineTo(toPixelX(i), toPixelY(0) + 3);
    if (i > 0 && i % 2 === 0) {
      ctx.fillText(i.toString(), toPixelX(i), toPixelY(0) + 20);
    }
    
    // Marcadores do eixo Y
    ctx.textAlign = 'right';
    ctx.fillText(i.toString(), toPixelX(0) - 10, toPixelY(i) + 4);
    ctx.moveTo(toPixelX(0) - 3, toPixelY(i));
    ctx.lineTo(toPixelX(0) + 3, toPixelY(i));
  }
  ctx.stroke();

  // Desenhar restrições
  restricoes.forEach((r, i) => {
    const { x: a, y: b } = extrairCoeficientes(r.lhs);
    const c = r.rhs;
    ctx.strokeStyle = COLORS[i % COLORS.length];
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (b !== 0) {
      // Equação da forma y = (c - a*x)/b
      const y1 = c / b; // Quando x = 0
      const y2 = (c - a * 15) / b; // Quando x = 15
      
      ctx.moveTo(toPixelX(0), toPixelY(y1));
      ctx.lineTo(toPixelX(15), toPixelY(y2));
      
      // Adicionar rótulo
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.font = '12px Arial';
      ctx.fillText(`R${i+1}: ${r.lhs} ${r.op} ${r.rhs}`, toPixelX(15) + 15, toPixelY(y2));
    } else if (a !== 0) {
      // Linha vertical x = c/a
      const x = c / a;
      ctx.moveTo(toPixelX(x), toPixelY(0));
      ctx.lineTo(toPixelX(x), toPixelY(15));
      
      // Adicionar rótulo
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.font = '12px Arial';
      ctx.fillText(`R${i+1}: ${r.lhs} ${r.op} ${r.rhs}`, toPixelX(x), toPixelY(15) + 20);
    }
    ctx.stroke();
  });

  // Desenhar região viável - VERSÃO MELHORADA
  const vertices = encontrarVertices(restricoes);
  
  if (vertices.length > 0) {
    // Ordena os vértices em sentido horário para desenho correto
    const centro = {
      x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
      y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length
    };
    
    vertices.sort((a, b) => {
      const anguloA = Math.atan2(a.y - centro.y, a.x - centro.x);
      const anguloB = Math.atan2(b.y - centro.y, b.x - centro.x);
      return anguloA - anguloB;
    });

    ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.beginPath();
    ctx.moveTo(toPixelX(vertices[0].x), toPixelY(vertices[0].y));
    
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(toPixelX(vertices[i].x), toPixelY(vertices[i].y));
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Desenha borda da região viável
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Desenhar solução ótima se existir
  if (solucao) {
    ctx.beginPath();
    ctx.fillStyle = '#E91E63';
    ctx.arc(toPixelX(solucao.x), toPixelY(solucao.y), 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Linhas auxiliares tracejadas
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.strokeStyle = '#E91E63';
    ctx.moveTo(toPixelX(solucao.x), toPixelY(0));
    ctx.lineTo(toPixelX(solucao.x), toPixelY(solucao.y));
    ctx.lineTo(toPixelX(0), toPixelY(solucao.y));
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Rótulo da solução
    ctx.fillStyle = '#E91E63';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Solução (${solucao.x.toFixed(2)}, ${solucao.y.toFixed(2)})`, 
                toPixelX(solucao.x) + 15, toPixelY(solucao.y) - 10);
  }

  // Atualizar legenda
  atualizarLegenda(restricoes);
}

// Cria/atualiza a legenda do gráfico
function atualizarLegenda(restricoes) {
  const legendContainer = document.createElement('div');
  legendContainer.className = 'graph-legend';
  
  restricoes.forEach((r, i) => {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-color" style="background-color: ${COLORS[i % COLORS.length]}"></div>
      <span>R${i+1}: ${r.lhs} ${r.op} ${r.rhs}</span>
    `;
    legendContainer.appendChild(legendItem);
  });
  
  const graphContainer = document.querySelector('.graph-container');
  const oldLegend = graphContainer.querySelector('.graph-legend');
  if (oldLegend) oldLegend.remove();
  graphContainer.appendChild(legendContainer);
}

/* ========== FUNÇÕES PRINCIPAIS ========== */

// Resolve o problema matematicamente (método dos vértices)
function resolverPL() {
  try {
    const objetivoStr = document.getElementById('objetivo').value;
    const restricoesStr = document.getElementById('restricoes').value;
    const tipoProblema = document.getElementById('tipoProblema').value;
    
    // Validação básica
    if (!objetivoStr.trim()) {
      throw new Error("Por favor, informe a função objetivo.");
    }

    const objetivo = extrairCoeficientes(objetivoStr);
    
    // Garante que os coeficientes são números válidos
    if (isNaN(objetivo.x)) objetivo.x = 0;
    if (isNaN(objetivo.y)) objetivo.y = 0;
    
    // Processa as restrições
    let restricoes = restricoesStr.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(parseRestricao)
      .filter(r => r);
    
    // Adiciona restrições de não-negatividade se não existirem
    if (!restricoes.some(r => r.lhs.includes('x') && r.op === '>=')) {
      restricoes.push({ lhs: 'x', op: '>=', rhs: 0 });
    }
    if (!restricoes.some(r => r.lhs.includes('y') && r.op === '>=')) {
      restricoes.push({ lhs: 'y', op: '>=', rhs: 0 });
    }
    
    // Encontra todos os vértices viáveis
    const vertices = encontrarVertices(restricoes);
    
    // Verifica se há solução viável
    if (vertices.length === 0) {
      let temSolucao = false;
      
      // Testa pontos distantes para ver se o problema é ilimitado
      if (pontoValido(1e6, 0, restricoes)) temSolucao = true;
      if (pontoValido(0, 1e6, restricoes)) temSolucao = true;
      if (pontoValido(1e6, 1e6, restricoes)) temSolucao = true;
      
      if (temSolucao) {
        document.getElementById('resultado').innerHTML = 
          '<strong class="error">O problema é ilimitado. A função objetivo pode atingir valores infinitos.</strong>';
      } else {
        document.getElementById('resultado').innerHTML = 
          '<strong class="error">Não há solução viável para o problema com as restrições fornecidas.</strong>';
      }
      return;
    }
    
    // Encontra a solução ótima
    let melhorValor = tipoProblema === 'max' ? -Infinity : Infinity;
    let pontoOtimo = null;
    
    vertices.forEach(p => {
      const valor = objetivo.x * p.x + objetivo.y * p.y;
      
      if ((tipoProblema === 'max' && valor > melhorValor) || 
          (tipoProblema === 'min' && valor < melhorValor)) {
        melhorValor = valor;
        pontoOtimo = p;
      }
    });
    
    // Exibe o resultado
    document.getElementById('resultado').innerHTML = `
      <strong class="success">Solução ótima encontrada:</strong><br><br>
      <strong>Valores das variáveis:</strong><br>
      x = ${pontoOtimo.x.toFixed(4)}<br>
      y = ${pontoOtimo.y.toFixed(4)}<br><br>
      <strong>Valor da função objetivo:</strong> ${melhorValor.toFixed(4)}<br><br>
      <strong>Método:</strong> Matemático (Pontos Extremos)<br>
      <strong>Número de vértices analisados:</strong> ${vertices.length}
    `;
    
    // Desenha o gráfico também
    desenharGrafico(objetivo, restricoes, pontoOtimo);
    
  } catch (error) {
    document.getElementById('resultado').innerHTML = 
      `<strong class="error">Erro: ${error.message}</strong>`;
  }
}

// Resolve o problema graficamente
function resolverGrafico() {
  try {
    const objetivoStr = document.getElementById('objetivo').value;
    const restricoesStr = document.getElementById('restricoes').value;
    const tipoProblema = document.getElementById('tipoProblema').value;
    
    if (!objetivoStr.trim()) {
      throw new Error("Por favor, informe a função objetivo.");
    }

    const objetivo = extrairCoeficientes(objetivoStr);
    
    if (isNaN(objetivo.x)) objetivo.x = 0;
    if (isNaN(objetivo.y)) objetivo.y = 0;
    
    let restricoes = restricoesStr.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(parseRestricao)
      .filter(r => r);
    
    // Adiciona restrições de não-negatividade
    if (!restricoes.some(r => r.lhs.includes('x') && r.op === '>=')) {
      restricoes.push({ lhs: 'x', op: '>=', rhs: 0 });
    }
    if (!restricoes.some(r => r.lhs.includes('y') && r.op === '>=')) {
      restricoes.push({ lhs: 'y', op: '>=', rhs: 0 });
    }
    
    // Encontra vértices
    const vertices = encontrarVertices(restricoes);
    
    // Encontra solução ótima
    let melhorValor = tipoProblema === 'max' ? -Infinity : Infinity;
    let pontoOtimo = null;
    
    vertices.forEach(p => {
      const valor = objetivo.x * p.x + objetivo.y * p.y;
      
      if ((tipoProblema === 'max' && valor > melhorValor) || 
          (tipoProblema === 'min' && valor < melhorValor)) {
        melhorValor = valor;
        pontoOtimo = p;
      }
    });
    
    // Desenha o gráfico
    desenharGrafico(objetivo, restricoes, pontoOtimo);
    
    // Exibe resultados
    if (pontoOtimo) {
      document.getElementById('resultado').innerHTML = `
        <strong class="success">Solução ótima encontrada:</strong><br><br>
        <strong>Valores das variáveis:</strong><br>
        x = ${pontoOtimo.x.toFixed(4)}<br>
        y = ${pontoOtimo.y.toFixed(4)}<br><br>
        <strong>Valor da função objetivo:</strong> ${melhorValor.toFixed(4)}<br><br>
        <strong>Método:</strong> Gráfico (veja a visualização acima)<br>
        <strong>Número de vértices analisados:</strong> ${vertices.length}
      `;
    } else {
      document.getElementById('resultado').innerHTML = 
        '<strong class="error">Não foi encontrada uma solução ótima.</strong>';
    }
    
  } catch (error) {
    document.getElementById('resultado').innerHTML = 
      `<strong class="error">Erro: ${error.message}</strong>`;
  }
}

// Carrega um exemplo pré-definido
function carregarExemplo() {
  document.getElementById('objetivo').value = '3x + 5y';
  document.getElementById('restricoes').value = 'x + y <= 10\n2x + y <= 16\nx >= 0\ny >= 0';
  document.getElementById('tipoProblema').value = 'max';
}

// Adiciona evento para o botão de exemplo
document.addEventListener('DOMContentLoaded', function() {
  const exemploBtn = document.createElement('button');
  exemploBtn.textContent = 'Carregar Exemplo';
  exemploBtn.onclick = carregarExemplo;
  exemploBtn.style.marginTop = '10px';
  exemploBtn.style.backgroundColor = '#FF9800';
  document.querySelector('.input-container').appendChild(exemploBtn);
});