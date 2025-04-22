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
    
    // Caso especial para quando a expressão é apenas "x" ou "y"
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
  
  // Função para verificar se um ponto satisfaz todas as restrições
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
  
  // Função principal que resolve o problema de programação linear
  function resolverPL() {
    try {
      const objetivoStr = document.getElementById('objetivo').value;
      const restricoesStr = document.getElementById('restricoes').value;
      const tipoProblema = document.getElementById('tipoProblema').value;
      
      // Verificar se a função objetivo foi informada
      if (!objetivoStr.trim()) {
        throw new Error("Por favor, informe a função objetivo.");
      }
  
      // Parsear a função objetivo
      const objetivo = extrairCoeficientes(objetivoStr);
      
      // Verificar se a função objetivo é válida
      if (isNaN(objetivo.x)) objetivo.x = 0;
      if (isNaN(objetivo.y)) objetivo.y = 0;
      
      // Parsear as restrições
      let restricoes = restricoesStr.split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(parseRestricao)
        .filter(r => r);
      
      // Adicionar restrições de não-negatividade se não estiverem presentes
      const hasXConstraint = restricoes.some(r => r.lhs.includes('x') && r.op === '>=');
      const hasYConstraint = restricoes.some(r => r.lhs.includes('y') && r.op === '>=');
      
      if (!hasXConstraint) {
        restricoes.push({ lhs: 'x', op: '>=', rhs: 0 });
      }
      if (!hasYConstraint) {
        restricoes.push({ lhs: 'y', op: '>=', rhs: 0 });
      }
      
      // Encontrar todos os vértices da região viável
      let vertices = [];
      
      // 1. Adicionar interseções com os eixos
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
      
      // 2. Adicionar interseções entre todas as restrições
      for (let i = 0; i < restricoes.length; i++) {
        for (let j = i + 1; j < restricoes.length; j++) {
          const r1 = restricoes[i];
          const r2 = restricoes[j];
          
          const { x: a1, y: b1 } = extrairCoeficientes(r1.lhs);
          const c1 = r1.rhs;
          
          const { x: a2, y: b2 } = extrairCoeficientes(r2.lhs);
          const c2 = r2.rhs;
          
          const det = a1 * b2 - a2 * b1;
          
          // Se as retas não são paralelas
          if (Math.abs(det) > 1e-6) {
            const x = (c1 * b2 - c2 * b1) / det;
            const y = (a1 * c2 - a2 * c1) / det;
            
            if (pontoValido(x, y, restricoes)) {
              vertices.push({ x, y });
            }
          }
        }
      }
      
      // Remover vértices duplicados (considerando tolerância numérica)
      vertices = vertices.filter((v, i) => 
        !vertices.some((w, j) => j < i && 
          Math.abs(v.x - w.x) < 1e-6 && 
          Math.abs(v.y - w.y) < 1e-6)
      );
      
      // Verificar se encontramos vértices viáveis
      if (vertices.length === 0) {
        // Verificar se o problema é ilimitado
        let temSolucao = false;
        
        // Testar se a região viável é ilimitada na direção positiva de x
        if (pontoValido(1e6, 0, restricoes)) temSolucao = true;
        
        // Testar se a região viável é ilimitada na direção positiva de y
        if (pontoValido(0, 1e6, restricoes)) temSolucao = true;
        
        // Testar uma direção diagonal
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
      
      // Encontrar a solução ótima
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
      
      // Exibir o resultado
      document.getElementById('resultado').innerHTML = `
        <strong class="success">Solução ótima encontrada:</strong><br><br>
        <strong>Valores das variáveis:</strong><br>
        x = ${pontoOtimo.x.toFixed(4)}<br>
        y = ${pontoOtimo.y.toFixed(4)}<br><br>
        <strong>Valor da função objetivo:</strong> ${melhorValor.toFixed(4)}<br><br>
        <strong>Tipo de problema:</strong> ${tipoProblema === 'max' ? 'Maximização' : 'Minimização'}<br>
        <strong>Número de vértices analisados:</strong> ${vertices.length}
      `;
      
    } catch (error) {
      document.getElementById('resultado').innerHTML = 
        `<strong class="error">Erro: ${error.message}</strong>`;
    }
  }