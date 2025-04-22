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

// Função para encontrar todos os vértices viáveis
function encontrarVertices(restricoes) {
    let vertices = [];
    
    // 1. Interseções com os eixos
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
    
    // 2. Interseções entre restrições
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
    
    // Remover vértices duplicados
    return vertices.filter((v, i) => 
        !vertices.some((w, j) => j < i && 
            Math.abs(v.x - w.x) < 1e-6 && 
            Math.abs(v.y - w.y) < 1e-6)
    );
}

// Função para resolver o problema matematicamente
function resolverPL() {
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
        
        // Adicionar restrições de não-negatividade se não estiverem presentes
        if (!restricoes.some(r => r.lhs.includes('x') && r.op === '>=')) {
            restricoes.push({ lhs: 'x', op: '>=', rhs: 0 });
        }
        if (!restricoes.some(r => r.lhs.includes('y') && r.op === '>=')) {
            restricoes.push({ lhs: 'y', op: '>=', rhs: 0 });
        }
        
        const vertices = encontrarVertices(restricoes);
        
        if (vertices.length === 0) {
            // Verificar se o problema é ilimitado
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
        
        // Encontrar solução ótima
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
        
        // Exibir resultado
        document.getElementById('resultado').innerHTML = `
            <strong class="success">Solução ótima encontrada:</strong><br><br>
            <strong>Valores das variáveis:</strong><br>
            x = ${pontoOtimo.x.toFixed(4)}<br>
            y = ${pontoOtimo.y.toFixed(4)}<br><br>
            <strong>Valor da função objetivo:</strong> ${melhorValor.toFixed(4)}<br><br>
            <strong>Método:</strong> Matemático (Pontos Extremos)<br>
            <strong>Número de vértices analisados:</strong> ${vertices.length}
        `;
        
    } catch (error) {
        document.getElementById('resultado').innerHTML = 
            `<strong class="error">Erro: ${error.message}</strong>`;
    }
}

// Função para desenhar o gráfico
function desenharGrafico(objetivo, restricoes, solucao) {
    const canvas = document.getElementById('grafico');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurações do gráfico
    const padding = 50;
    const scale = 25;
    const colors = ['#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#FFC107'];
    
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
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (b !== 0) {
            // Equação da forma y = (c - a*x)/b
            const y1 = c / b; // Quando x = 0
            const y2 = (c - a * 15) / b; // Quando x = 15
            
            ctx.moveTo(toPixelX(0), toPixelY(y1));
            ctx.lineTo(toPixelX(15), toPixelY(y2));
            
            // Adicionar rótulo
            ctx.fillStyle = colors[i % colors.length];
            ctx.font = '12px Arial';
            ctx.fillText(`R${i+1}`, toPixelX(15) + 15, toPixelY(y2));
        } else if (a !== 0) {
            // Linha vertical x = c/a
            const x = c / a;
            ctx.moveTo(toPixelX(x), toPixelY(0));
            ctx.lineTo(toPixelX(x), toPixelY(15));
            
            // Adicionar rótulo
            ctx.fillStyle = colors[i % colors.length];
            ctx.font = '12px Arial';
            ctx.fillText(`R${i+1}`, toPixelX(x), toPixelY(15) + 20);
        }
        ctx.stroke();
    });

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
}

// Função principal para resolver graficamente
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
        
        // Adicionar restrições de não-negatividade
        if (!restricoes.some(r => r.lhs.includes('x') && r.op === '>=')) {
            restricoes.push({ lhs: 'x', op: '>=', rhs: 0 });
        }
        if (!restricoes.some(r => r.lhs.includes('y') && r.op === '>=')) {
            restricoes.push({ lhs: 'y', op: '>=', rhs: 0 });
        }
        
        // Encontrar vértices
        const vertices = encontrarVertices(restricoes);
        
        // Encontrar solução ótima
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
        
        // Desenhar o gráfico
        desenharGrafico(objetivo, restricoes, pontoOtimo);
        
        // Exibir resultados
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