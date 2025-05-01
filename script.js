const COLORS = ['#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#FFC107', '#795548'];

function adicionarRestricao(coefX = '', coefY = '', operador = '<=', valor = '') {
  const container = document.getElementById('restricoes-container');
  const div = document.createElement('div');
  div.className = 'restricao-item';
  
  div.innerHTML = `
    <div class="constraint-input">
      <input type="number" class="restricao-x" placeholder="x" value="${coefX}" step="any">
      <span>x +</span>
      <input type="number" class="restricao-y" placeholder="y" value="${coefY}" step="any">
      <span>y</span>
      <select class="restricao-op">
        <option value="<=" ${operador === '<=' ? 'selected' : ''}>≤</option>
        <option value=">=" ${operador === '>=' ? 'selected' : ''}>≥</option>
      </select>
      <input type="number" class="restricao-valor" placeholder="valor" value="${valor}" step="any">
    </div>
    <button class="btn-remove" onclick="this.parentElement.remove()">Remover</button>
  `;
  
  container.appendChild(div);
}

function obterRestricoes() {
  const restricoes = [];
  const itens = document.querySelectorAll('.restricao-item');
  
  itens.forEach(item => {
    const coefX = item.querySelector('.restricao-x').value.trim();
    const coefY = item.querySelector('.restricao-y').value.trim();
    const op = item.querySelector('.restricao-op').value;
    const valor = item.querySelector('.restricao-valor').value;
    
    if ((coefX || coefY) && valor) {
      restricoes.push({
        lhs: `${coefX || '0'}x + ${coefY || '0'}y`,
        op: op,
        rhs: parseFloat(valor)
      });
    }
  });
  
  return restricoes;
}

function carregarExemplo() {
  document.getElementById('obj-x').value = '3';
  document.getElementById('obj-y').value = '5';
  
  const container = document.getElementById('restricoes-container');
  container.innerHTML = '';
  
  adicionarRestricao('1', '1', '<=', '10');
  adicionarRestricao('2', '1', '<=', '16');
  adicionarRestricao('1', '0', '>=', '0');
  adicionarRestricao('0', '1', '>=', '0');
}

function extrairCoeficientes(expr) {
  const regex = /([+-]?\s*\d*\.?\d*)\s*([xy])/gi;
  let result = { x: 0, y: 0 };
  let m;
  
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

function encontrarVertices(restricoes) {
  let vertices = [];
  
  if (pontoValido(0, 0, restricoes)) {
    vertices.push({ x: 0, y: 0 });
  }

  restricoes.forEach(r => {
    const { x: a, y: b } = extrairCoeficientes(r.lhs);
    const c = r.rhs;
    
    if (a !== 0) {
      const x = c / a;
      if (pontoValido(x, 0, restricoes)) {
        vertices.push({ x, y: 0 });
      }
    }
    
    if (b !== 0) {
      const y = c / b;
      if (pontoValido(0, y, restricoes)) {
        vertices.push({ x: 0, y });
      }
    }
  });
  
  for (let i = 0; i < restricoes.length; i++) {
    for (let j = i + 1; j < restricoes.length; j++) {
      const r1 = restricoes[i];
      const r2 = restricoes[j];
      
      const { x: a1, y: b1 } = extrairCoeficientes(r1.lhs);
      const c1 = r1.rhs;
      const { x: a2, y: b2 } = extrairCoeficientes(r2.lhs);
      const c2 = r2.rhs;
      
      const det = a1 * b2 - a2 * b1;
      
      if (Math.abs(det) > 1e-6) {
        const x = (c1 * b2 - c2 * b1) / det;
        const y = (a1 * c2 - a2 * c1) / det;
        
        if (pontoValido(x, y, restricoes)) {
          vertices.push({ x, y });
        }
      }
    }
  }

  return vertices.filter((v, i) => 
    !vertices.some((w, j) => j < i && 
      Math.abs(v.x - w.x) < 1e-6 && 
      Math.abs(v.y - w.y) < 1e-6)
  );
}

function desenharGrafico(objetivo, restricoes, solucao) {
  const canvas = document.getElementById('grafico');
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const padding = 50;
  const scale = 25;
  
  const toPixelX = (x) => padding + x * scale;
  const toPixelY = (y) => canvas.height - padding - y * scale;

  ctx.beginPath();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  
  
  ctx.moveTo(toPixelX(0), toPixelY(0));
  ctx.lineTo(toPixelX(15), toPixelY(0));
  
  
  ctx.moveTo(toPixelX(0), toPixelY(0));
  ctx.lineTo(toPixelX(0), toPixelY(15));
  
  
  ctx.font = '12px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  
  for (let i = 0; i <= 15; i += 1) {
    
    ctx.moveTo(toPixelX(i), toPixelY(0) - 3);
    ctx.lineTo(toPixelX(i), toPixelY(0) + 3);
    if (i > 0 && i % 2 === 0) {
      ctx.fillText(i.toString(), toPixelX(i), toPixelY(0) + 20);
    }
    
    
    ctx.textAlign = 'right';
    ctx.fillText(i.toString(), toPixelX(0) - 10, toPixelY(i) + 4);
    ctx.moveTo(toPixelX(0) - 3, toPixelY(i));
    ctx.lineTo(toPixelX(0) + 3, toPixelY(i));
  }
  ctx.stroke();

  
  restricoes.forEach((r, i) => {
    const { x: a, y: b } = extrairCoeficientes(r.lhs);
    const c = r.rhs;
    ctx.strokeStyle = COLORS[i % COLORS.length];
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (b !== 0) {
      const y1 = c / b;
      const y2 = (c - a * 15) / b;
      
      ctx.moveTo(toPixelX(0), toPixelY(y1));
      ctx.lineTo(toPixelX(15), toPixelY(y2));
      
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.font = '12px Arial';
      ctx.fillText(`R${i+1}: ${r.lhs} ${r.op} ${r.rhs}`, toPixelX(15) + 15, toPixelY(y2));
    } else if (a !== 0) {
      const x = c / a;
      ctx.moveTo(toPixelX(x), toPixelY(0));
      ctx.lineTo(toPixelX(x), toPixelY(15));
      
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.font = '12px Arial';
      ctx.fillText(`R${i+1}: ${r.lhs} ${r.op} ${r.rhs}`, toPixelX(x), toPixelY(15) + 20);
    }
    ctx.stroke();
  });

 
  const vertices = encontrarVertices(restricoes);
  
  
  vertices.forEach(v => {
    ctx.beginPath();
    ctx.fillStyle = '#FF0000';
    ctx.arc(toPixelX(v.x), toPixelY(v.y), 4, 0, Math.PI * 2);
    ctx.fill();
    
    
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(`(${v.x.toFixed(1)},${v.y.toFixed(1)})`, toPixelX(v.x) + 10, toPixelY(v.y) - 5);
  });

  if (vertices.length > 0) {
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
    
    
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  
  if (solucao) {
    ctx.beginPath();
    ctx.fillStyle = '#E91E63';
    ctx.arc(toPixelX(solucao.x), toPixelY(solucao.y), 6, 0, Math.PI * 2);
    ctx.fill();
    
    
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.strokeStyle = '#E91E63';
    ctx.moveTo(toPixelX(solucao.x), toPixelY(0));
    ctx.lineTo(toPixelX(solucao.x), toPixelY(solucao.y));
    ctx.lineTo(toPixelX(0), toPixelY(solucao.y));
    ctx.stroke();
    ctx.setLineDash([]);
    
    
    ctx.fillStyle = '#E91E63';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Solução (${solucao.x.toFixed(2)}, ${solucao.y.toFixed(2)})`, 
                toPixelX(solucao.x) + 15, toPixelY(solucao.y) - 10);
  }

  atualizarLegenda(restricoes);
}

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

function resolverPL() {
  try {
    const objX = document.getElementById('obj-x').value;
    const objY = document.getElementById('obj-y').value;
    const tipoProblema = document.getElementById('tipoProblema').value;
    const restricoes = obterRestricoes();
    
    if (!objX && !objY) {
      throw new Error("Por favor, informe os coeficientes da função objetivo.");
    }

    const objetivo = {
      x: parseFloat(objX) || 0,
      y: parseFloat(objY) || 0
    };
    
    if (restricoes.length === 0) {
      throw new Error("Por favor, adicione pelo menos uma restrição.");
    }
    
    const vertices = encontrarVertices(restricoes);
    
    if (vertices.length === 0) {
      let temSolucao = false;
      
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
    
    document.getElementById('resultado').innerHTML = `
      <strong class="success">Solução ótima encontrada:</strong><br><br>
      <strong>Valores das variáveis:</strong><br>
      x = ${pontoOtimo.x.toFixed(4)}<br>
      y = ${pontoOtimo.y.toFixed(4)}<br><br>
      <strong>Valor da função objetivo:</strong> ${melhorValor.toFixed(4)}<br><br>
      <strong>Método:</strong> Matemático (Pontos Extremos)<br>
      <strong>Número de vértices analisados:</strong> ${vertices.length}
    `;
    
    desenharGrafico(objetivo, restricoes, pontoOtimo);
    
  } catch (error) {
    document.getElementById('resultado').innerHTML = 
      `<strong class="error">Erro: ${error.message}</strong>`;
  }
}

function resolverGrafico() {
  try {
    const objX = document.getElementById('obj-x').value;
    const objY = document.getElementById('obj-y').value;
    const tipoProblema = document.getElementById('tipoProblema').value;
    const restricoes = obterRestricoes();
    
    if (!objX && !objY) {
      throw new Error("Por favor, informe os coeficientes da função objetivo.");
    }

    const objetivo = {
      x: parseFloat(objX) || 0,
      y: parseFloat(objY) || 0
    };
    
    if (restricoes.length === 0) {
      throw new Error("Por favor, adicione pelo menos uma restrição.");
    }
    
    const vertices = encontrarVertices(restricoes);
    
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
    
    desenharGrafico(objetivo, restricoes, pontoOtimo);
    
    if (pontoOtimo) {
      document.getElementById('resultado').innerHTML = `
        <strong class="success">Solução ótima encontrada:</strong><br><br>
        <strong>Valores das variáveis:</strong><br>
        x = ${pontoOtimo.x.toFixed(4)}<br>
        y = ${pontoOtimo.y.toFixed(4)}<br><br>
        <strong>Valor da função objetivo:</strong> ${melhorValor.toFixed(4)}<br><br>
        <strong>Método:</strong> Gráfico (veja a visualização abaixo)<br>
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

document.addEventListener('DOMContentLoaded', function() {
  adicionarRestricao();
});