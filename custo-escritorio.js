// Adicione os event listeners para os botões de voltar
document.getElementById('backButtonVog').addEventListener('click', function() {
    showAllGroups('Vog');
});

document.getElementById('backButtonAndrey').addEventListener('click', function() {
    showAllGroups('Andrey');
});

// Variáveis globais
let fixedTooltips = {
    Vog: { line: null, pie: null },
    Andrey: { line: null, pie: null }
};
let currentMode = 'comment'; // Pode ser 'dynamic', 'comment' ou 'fixedTooltip'
let annotations = {
    Vog: { 
        groups: { line: {}, pie: {} },
        sectors: { line: {}, pie: {} }
    },
    Andrey: { 
        groups: { line: {}, pie: {} },
        sectors: { line: {}, pie: {} }
    }
};
let currentAnnotationPoint = null;
let currentAnnotationChart = null;
let currentAnnotationCompany = null;
let mainChartVog = null;
let mainChartAndrey = null;
let pieChartVog = null;
let pieChartAndrey = null;
let currentGroupVog = null;
let currentGroupAndrey = null;
let isLogScale = false;
const groupColors = [
    '#FF6384', '#808080', '#EEB422', '#4BC0C0', 
    '#800080', '#FF9F40', '#00FF00', '#FF0000'
];
const sectorColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#800080',
    '#8c564b', '#EEB422', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
];

Chart.register(ChartDataLabels);

// Modal elements
const modal = document.getElementById('annotationModal');
const closeBtn = document.querySelector('.close');
const annotationText = document.getElementById('annotationText');
const saveAnnotationBtn = document.getElementById('saveAnnotation');
const annotationsList = document.getElementById('annotationsList');


annotationText.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
// Event listeners para o modal
document.getElementById('toggleCommentMode').addEventListener('click', function() {
    // Cicla entre os modos na ordem correta
    if (currentMode === 'dynamic') {
        currentMode = 'comment';
        this.textContent = 'Modo Comentários';
    } else if (currentMode === 'comment') {
        currentMode = 'fixedTooltip';
        this.textContent = 'Modo Fixar Tooltip';
    } else {
        currentMode = 'dynamic';
        this.textContent = 'Modo Dinâmico';
        
        // Remove tooltips fixos quando volta ao modo dinâmico
        removeFixedTooltips();
    }
    
    // Feedback visual
    const feedback = document.createElement('div');
    feedback.textContent = `Modo ${getModeName(currentMode)} ativado`;
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.right = '20px';
    feedback.style.backgroundColor = '#333';
    feedback.style.color = 'white';
    feedback.style.padding = '10px';
    feedback.style.borderRadius = '5px';
    feedback.style.zIndex = '1000';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        document.body.removeChild(feedback);
    }, 2000);
});


function getModeName(mode) {
    switch(mode) {
        case 'dynamic': return 'Dinâmico';
        case 'comment': return 'Comentários';
        case 'fixedTooltip': return 'Fixar Tooltip';
        default: return '';
    }
}

closeBtn.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

saveAnnotationBtn.addEventListener('click', saveAnnotation);

function removeFixedTooltips() {
    // Remove todos os tooltips fixos
    Object.keys(fixedTooltips).forEach(company => {
        fixedTooltips[company].line = null;
        fixedTooltips[company].pie = null;
        
        const charts = company === 'Vog' ? 
            { line: mainChartVog, pie: pieChartVog } : 
            { line: mainChartAndrey, pie: pieChartAndrey };
            
        if (charts.line) charts.line.update();
        if (charts.pie) charts.pie.update();
    });
}

// Função para mostrar o modal de anotação
function showAnnotationModal(chart, company, point) {
    currentAnnotationPoint = point;
    currentAnnotationChart = chart;
    currentAnnotationCompany = company;
    
    // Determina se é grupo ou setor
    const isPieChart = chart.config.type === 'pie';
    const isLineChartGroup = chart.config.type === 'line' && chart.data.datasets[point.datasetIndex]?.isGroup;
    
    currentAnnotationType = (isPieChart && !(company === 'Vog' ? currentGroupVog : currentGroupAndrey)) || isLineChartGroup 
                          ? 'groups' : 'sectors';
    
    annotationText.value = '';
    loadAnnotationsForPoint();
    modal.style.display = 'block';
    updateChartWithAnnotations(chart, company);
}

// Função para carregar anotações existentes
function loadAnnotationsForPoint() {
    annotationsList.innerHTML = '';
    
    const chartType = currentAnnotationChart.config.type === 'line' ? 'line' : 'pie';
    const pointKey = currentAnnotationChart.config.type === 'line' ? 
        `${currentAnnotationPoint.label}-${currentAnnotationPoint.datasetIndex}` : 
        currentAnnotationPoint.label;
    
    const companyAnnotations = annotations[currentAnnotationCompany][chartType];
    
    if (companyAnnotations[pointKey]) {
        companyAnnotations[pointKey].forEach((note, index) => {
            const annotationItem = document.createElement('div');
            annotationItem.className = 'annotation-item';
            annotationItem.innerHTML = `
                <p>${note}</p>
                <button onclick="deleteAnnotation(${index})" class="delete-annotation">Excluir</button>
            `;
            annotationsList.appendChild(annotationItem);
        });
    }
}

// Função para salvar uma nova anotação
function saveAnnotation() {
    const note = annotationText.value.trim();
    if (!note) return;
    
    // Substitui quebras de linha por <br> para exibição no HTML
    const noteWithBreaks = note.replace(/\n/g, '<br>');
    
    const chartType = currentAnnotationChart.config.type === 'line' ? 'line' : 'pie';
    const pointKey = currentAnnotationChart.config.type === 'line' ? 
        `${currentAnnotationPoint.label}-${currentAnnotationPoint.datasetIndex}` : 
        currentAnnotationPoint.label;
    
    if (!annotations[currentAnnotationCompany][currentAnnotationType][chartType][pointKey]) {
        annotations[currentAnnotationCompany][currentAnnotationType][chartType][pointKey] = [];
    }
    
    annotations[currentAnnotationCompany][currentAnnotationType][chartType][pointKey].push(noteWithBreaks);
    
    loadAnnotationsForPoint();
    annotationText.value = '';
    updateChartWithAnnotations(currentAnnotationChart, currentAnnotationCompany);
    modal.style.display = 'none';
}

function loadAnnotationsForPoint() {
    annotationsList.innerHTML = '';
    
    const chartType = currentAnnotationChart.config.type === 'line' ? 'line' : 'pie';
    const pointKey = currentAnnotationChart.config.type === 'line' ? 
        `${currentAnnotationPoint.label}-${currentAnnotationPoint.datasetIndex}` : 
        currentAnnotationPoint.label;
    
    const relevantAnnotations = annotations[currentAnnotationCompany][currentAnnotationType][chartType];
    
    if (relevantAnnotations[pointKey]) {
        relevantAnnotations[pointKey].forEach((note, index) => {
            const annotationItem = document.createElement('div');
            annotationItem.className = 'annotation-item';
            annotationItem.innerHTML = `
                <p>${note.replace(/<br>/g, '\n')}</p>
                <button onclick="deleteAnnotation(${index})" class="delete-annotation">Excluir</button>
            `;
            annotationsList.appendChild(annotationItem);
        });
    }
}

// Função para deletar anotação
window.deleteAnnotation = function(index) {
    const chartType = currentAnnotationChart.config.type === 'line' ? 'line' : 'pie';
    const pointKey = currentAnnotationChart.config.type === 'line' ? 
        `${currentAnnotationPoint.label}-${currentAnnotationPoint.datasetIndex}` : 
        currentAnnotationPoint.label;
    
    annotations[currentAnnotationCompany][currentAnnotationType][chartType][pointKey].splice(index, 1);
    loadAnnotationsForPoint();
    updateChartWithAnnotations(currentAnnotationChart, currentAnnotationCompany);
}

// Função para atualizar o gráfico com marcadores de anotação
function updateChartWithAnnotations(chart, company) {
    const isGroupView = !(company === 'Vog' ? currentGroupVog : currentGroupAndrey);
    const annotationType = isGroupView ? 'groups' : 'sectors';
    const chartType = chart.config.type;

    if (chartType === 'line') {
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            dataset.pointStyle = dataset.data.map((value, index) => {
                const pointKey = `${chart.data.labels[index]}-${datasetIndex}`;
                const hasAnnotation = annotations[company]?.[annotationType]?.line?.[pointKey]?.length > 0;
                return hasAnnotation ? 'triangle' : 'circle';
            });
        });
    } 
    else if (chartType === 'pie') {
        chart.data.datasets.forEach(dataset => {
            dataset.borderColor = dataset.data.map((value, index) => {
                const pointKey = chart.data.labels[index];
                const hasAnnotation = annotations[company]?.[annotationType]?.pie?.[pointKey]?.length > 0;
                return hasAnnotation ? '#ff0000' : 'transparent';
            });
            dataset.borderWidth = 2;
        });
    }

    // Atualiza tooltips fixos se necessário
    if (currentMode === 'fixedTooltip') {
        const fixedTooltip = fixedTooltips[company][chartType];
        if (fixedTooltip) {
            chart.tooltip.setActiveElements([{
                datasetIndex: fixedTooltip.datasetIndex || 0,
                index: fixedTooltip.index
            }]);
        }
    }

    chart.update();
}

// Função para formatar valores monetários
function formatMoney(value) {
    if (isNaN(value)) return 'R$ 0,00';
    return 'R$ ' + value.toFixed(2)
        .replace('.', ',')
        .replace(/(\d)(?=(\d{3})+\,)/g, '$1.');
}

// Event listeners
document.getElementById('generateChart').addEventListener('click', function() {
    const rawData = document.getElementById('dataInput').value.trim();
    if (!rawData) {
        alert('Por favor, cole os dados antes de gerar o gráfico.');
        return;
    }
    
    const { vogData, andreyData, availableMonths } = parseData(rawData);
    
    // Mostra o container principal e os controles
    document.getElementById('chartContainer').style.display = 'block';
    document.getElementById('chartControls').style.display = 'flex';
    
    createCharts(vogData, andreyData, availableMonths); // Agora passando availableMonths
});

document.getElementById('toggleScale').addEventListener('click', function() {
    isLogScale = !isLogScale;
    updateChartScale();
    this.textContent = isLogScale ? 'Alternar para Escala Normal' : 'Alternar para Escala Logarítmica';
});

// Função para parsear os dados
function parseData(rawData) {
    const lines = rawData.split('\n');
    let currentCompany = null;
    const vogData = [];
    const andreyData = [];
    
    // Lista de grupos/setores a serem excluídos
    const excludedItems = [
        "Comissões Vendedores",
        "Despesas Filial Soberano",
        "Transportadora Soberano",
        "Reffinato Produção",
        "TOTAL",
        "TOTAL GERAL",
        "DESPESAS DE ESCRITÓRIO REAL"
    ];
    
    // Primeiro, identificamos os meses disponíveis
    let availableMonths = [];
    for (const line of lines) {
        if (line.includes('Janeiro') || line.includes('Fevereiro') || line.includes('Março') || 
            line.includes('Abril') || line.includes('Maio') || line.includes('Junho') ||
            line.includes('Julho') || line.includes('Agosto') || line.includes('Setembro') ||
            line.includes('Outubro') || line.includes('Novembro') || line.includes('Dezembro')) {
            
            const parts = line.split('\t').filter(part => part.trim() !== '');
            // Pega todos os cabeçalhos que são meses
            availableMonths = parts.slice(2).filter(part => 
                part.trim().match(/^(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)$/)
            );
            break;
        }
    }
    
    for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Verifica se é um cabeçalho de empresa
        if (line.includes('Empresa Vog')) {
            currentCompany = 'Vog';
            continue;
        } else if (line.includes('Empresa Andrey')) {
            currentCompany = 'Andrey';
            continue;
        } else if (line.includes('Total Geral') || line.includes('Total')) {
            continue; // Ignora linhas de total
        }
        
        // Split by tabs
        const parts = line.split('\t').filter(part => part.trim() !== '');
        
        if (parts.length >= 3 && currentCompany) { // Mínimo: Grupo, Setor e pelo menos 1 mês
            const group = parts[0].trim();
            const sector = parts[1].trim();
            
            // Verifica se este item deve ser excluído
            if (excludedItems.includes(group) || excludedItems.includes(sector)) {
                continue;
            }
            
            const values = [];
            let monthIndex = 0;
            
            // Processa os valores dos meses
            for (let i = 2; i < parts.length; i++) {
                // Ignora cabeçalhos de meses que possam estar no meio dos dados
                if (parts[i].trim().match(/^(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)$/)) {
                    continue;
                }
                
                if (monthIndex >= availableMonths.length) break;
                
                if (parts[i].trim() === 'R$ -' || parts[i].trim() === '-') {
                    values.push(0); // Trata valores vazios como zero
                } else {
                    const num = parts[i].replace('R$', '').trim()
                        .replace(/\./g, '').replace(',', '.');
                    values.push(parseFloat(num) || 0); // Se não converter, usa zero
                }
                monthIndex++;
            }
            
            // Completa com zeros se faltarem meses no final
            while (values.length < availableMonths.length) {
                values.push(0);
            }
            
            const dataItem = {
                group,
                sector,
                values
            };
            
            if (currentCompany === 'Vog') {
                vogData.push(dataItem);
            } else if (currentCompany === 'Andrey') {
                andreyData.push(dataItem);
            }
        }
    }
    
    return { vogData, andreyData, availableMonths };
}

// Função para organizar os dados por grupo e setor
function organizeData(data) {
    const groups = {};
    const sectors = {};
    
    for (const item of data) {
        // Acumula por grupo
        if (!groups[item.group]) {
            groups[item.group] = item.values.map(val => 0);
        }
        
        for (let i = 0; i < item.values.length; i++) {
            groups[item.group][i] += item.values[i];
        }
        
        // Armazena setores com referência ao grupo
        sectors[item.sector] = {
            group: item.group,
            values: item.values
        };
    }
    
    return {
        groupData: groups,
        sectorData: sectors
    };
}

function setupChartResizeHandlers() {
    let lastWindowHeight = window.innerHeight;
    let resizeTimer;

    // Verifica mudanças de altura (como barra de downloads aparecendo/desaparecendo)
    setInterval(function() {
        if (window.innerHeight !== lastWindowHeight) {
            lastWindowHeight = window.innerHeight;
            redrawAllCharts();
        }
    }, 200);

    // Redesenha quando a janela ganha foco
    window.addEventListener('focus', function() {
        setTimeout(redrawAllCharts, 100);
    });

    // Redesenha após redimensionamento
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(redrawAllCharts, 250);
    });

    // Redesenha quando a visibilidade da página muda
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            setTimeout(redrawAllCharts, 100);
        }
    });
}

// Função principal para criar os gráficos
function createCharts(vogData, andreyData, availableMonths) {
    const vogOrganized = organizeData(vogData);
    const andreyOrganized = organizeData(andreyData);
    
    // Configuração de DPI para melhor qualidade
    const setChartDimensions = function() {
        const containers = document.querySelectorAll('.pie-chart-container');
        containers.forEach(container => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                // Usa o tamanho do container, mas com limites máximos
                const computedStyle = getComputedStyle(container);
                const width = parseInt(computedStyle.width);
                const height = parseInt(computedStyle.height);

                // Ajusta DPI para melhor qualidade
                const dpi = window.devicePixelRatio || 1;
                canvas.width = width * dpi;
                canvas.height = height * dpi;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                // Aplica scaling para alta resolução
                const ctx = canvas.getContext('2d');
                ctx.scale(dpi, dpi);
            }
        });

        // Atualiza os gráficos após redimensionamento
        if (mainChartVog) mainChartVog.resize();
        if (mainChartAndrey) mainChartAndrey.resize();
        if (pieChartVog) pieChartVog.resize();
        if (pieChartAndrey) pieChartAndrey.resize();
    };
    
    setChartDimensions();
    window.addEventListener('resize', setChartDimensions);
    
    // Cria gráficos para Vog
    createCompanyCharts('Vog', vogOrganized, availableMonths);
    // Cria gráficos para Andrey
    createCompanyCharts('Andrey', andreyOrganized, availableMonths);

    setupChartResizeHandlers();
}

// Função para criar gráficos de uma empresa específica
function createCompanyCharts(company, organizedData, months) {
    const { groupData, sectorData } = organizedData;
    const ctxLine = document.getElementById(`mainChart${company}`).getContext('2d');
    const ctxPie = document.getElementById(`pieChart${company}`).getContext('2d');
    
    // Destrói os gráficos existentes
    if (company === 'Vog' && mainChartVog !== null) {
        mainChartVog.destroy();
        pieChartVog.destroy();
    } else if (company === 'Andrey' && mainChartAndrey !== null) {
        mainChartAndrey.destroy();
        pieChartAndrey.destroy();
    }
    
    const groupNames = Object.keys(groupData);

    // Calcula totais por grupo para o gráfico de pizza
    const groupTotals = {};
    groupNames.forEach(group => {
        groupTotals[group] = groupData[group].reduce((a, b) => a + b, 0);
    });
    
    // Configuração do gráfico de linhas
    const lineDatasets = groupNames.map((group, index) => {
        return {
            label: group,
            data: groupData[group],
            borderColor: groupColors[index % groupColors.length],
            backgroundColor: groupColors[index % groupColors.length], 
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            group: group,
            isGroup: true,
            
            // Adiciona configuração para mostrar os rótulos
            datalabels: {
                display: true,
                align: 'top',
                formatter: function(value) {
                    return formatMoney(value);
                },
                color: groupColors[index % groupColors.length],
                font: {
                    weight: 'bold',
                    size: 10
                }
            }
        };
    });
    
    // Cria o gráfico de linhas
    const lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: months,
            datasets: lineDatasets
        },
        options: getChartOptions('Grupo', company)
    });
    
    const pieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: groupNames,
            datasets: [{
                data: groupNames.map(group => groupTotals[group]),
                backgroundColor: groupNames.map((group, index) => groupColors[index % groupColors.length]),
                borderWidth: 1
            }]
        },
        options: getChartOptions('pie', company),
        plugins: [ChartDataLabels]
    });
    
    // Armazena os gráficos e dados
    if (company === 'Vog') {
        mainChartVog = lineChart;
        pieChartVog = pieChart;
        mainChartVog.sectorData = sectorData;
        pieChartVog.sectorData = sectorData;
    } else {
        mainChartAndrey = lineChart;
        pieChartAndrey = pieChart;
        mainChartAndrey.sectorData = sectorData;
        pieChartAndrey.sectorData = sectorData;
    }

    lineChart.options.onClick = function(evt, elements) {
        if (elements.length > 0) {
            if (commentMode) {
                const point = {
                    label: this.data.labels[elements[0].index],
                    datasetIndex: elements[0].datasetIndex,
                    value: this.data.datasets[elements[0].datasetIndex].data[elements[0].index]
                };
                showAnnotationModal(this, company, point);
            } else {
                const clickedDatasetIndex = elements[0].datasetIndex;
                const clickedDataset = this.data.datasets[clickedDatasetIndex];

                if (clickedDataset.isGroup) {
                    if (company === 'Vog') {
                        currentGroupVog = clickedDataset.group;
                        showGroupSectors(currentGroupVog, 'Vog');
                    } else {
                        currentGroupAndrey = clickedDataset.group;
                        showGroupSectors(currentGroupAndrey, 'Andrey');
                    }
                }
            }
        }
    };

    pieChart.options.onClick = function(evt, elements) {
        if (elements.length > 0) {
            if (currentMode === 'comment') {
                const point = {
                    label: this.data.labels[elements[0].index],
                    value: this.data.datasets[0].data[elements[0].index]
                };
                showAnnotationModal(this, company, point);
            } 
            else if (currentMode === 'fixedTooltip') {
                fixedTooltips[company].pie = {
                    index: elements[0].index,
                    datasetIndex: 0
                };
                this.update();
            }
            else if (!(company === 'Vog' ? currentGroupVog : currentGroupAndrey)) {
                const clickedGroup = this.data.labels[elements[0].index];
                if (company === 'Vog') {
                    currentGroupVog = clickedGroup;
                    showGroupSectors(currentGroupVog, 'Vog');
                } else {
                    currentGroupAndrey = clickedGroup;
                    showGroupSectors(currentGroupAndrey, 'Andrey');
                }
            }
        }
    };
    
    // Atualiza os gráficos com anotações existentes
    setupCommentListeners(lineChart, company);
    setupCommentListeners(pieChart, company);
}

function getChartOptions(dataType, company) {
    const commonTooltipCallbacks = {
        label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            if (context.chart.config.type === 'pie') {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${formatMoney(value)} (${percentage}%)`;
            }
            return `${label}: ${formatMoney(value)}`;
        },
        afterBody: function(context) {
            if (!context || !context.length) return '';

            const firstContext = context[0];
            const chart = firstContext.chart;
            const company = chart.options.plugins.title.text.split(' - ').pop();
            const isGroupView = !(company === 'Vog' ? currentGroupVog : currentGroupAndrey);
            const annotationType = isGroupView ? 'groups' : 'sectors';
            const annotationsToUse = annotations[company][annotationType];

            let pointKey;
            if (chart.config.type === 'line') {
                pointKey = `${firstContext.label}-${firstContext.datasetIndex}`;
            } else {
                pointKey = firstContext.label;
            }

            if (annotationsToUse[chart.config.type][pointKey]?.length > 0) {
                // Para gráficos de linha, usamos um array onde cada item é uma nova linha
                if (chart.config.type === 'line') {
                    const result = ['Anotações:'];
                    annotationsToUse[chart.config.type][pointKey].forEach(note => {
                        // Divide por <br> e adiciona cada parte como um novo item do array
                        const lines = note.split('<br>');
                        lines.forEach(line => result.push(line));
                    });
                    return result;
                } 
                // Para gráficos de pizza, juntamos tudo em uma string com \n
                else {
                    let result = 'Anotações:\n';
                    annotationsToUse[chart.config.type][pointKey].forEach(note => {
                        result += note.replace(/<br>/g, '\n') + '\n';
                    });
                    return result.trim();
                }
            }
            return '';
        }
    };

    if (dataType === 'pie') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: company === 'Vog' 
                        ? (currentGroupVog ? `Gastos por Setor - ${currentGroupVog} - Vog` : 'Gastos por Grupo - Vog')
                        : (currentGroupAndrey ? `Gastos por Setor - ${currentGroupAndrey} - Andrey` : 'Gastos por Grupo - Andrey'),
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatMoney(value)} (${percentage}%)`;
                        },
                        afterBody: function(context) {
                            if (!context || !context.length) return '';

                            const firstContext = context[0];
                            const pointKey = firstContext.label;
                            const isGroupView = !(company === 'Vog' ? currentGroupVog : currentGroupAndrey);
                            const annotationType = isGroupView ? 'groups' : 'sectors';
                            const companyAnnotations = annotations[company] || {};
                            const typeAnnotations = companyAnnotations[annotationType] || {};
                            const pieAnnotations = typeAnnotations.pie || {};

                            if (pieAnnotations[pointKey]?.length > 0) {
                                let result = 'Comentários:\n';
                                pieAnnotations[pointKey].forEach(note => {
                                    result += note.replace(/<br>/g, '\n') + '\n';
                                });
                                return result.trim();
                            }
                            return '';
                        }
                    }
                },
                datalabels: {
                    formatter: (value, context) => {
                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${percentage}%`;
                    },
                    color: '#000000',
                    font: {
                        weight: 'bold'
                    }
                }
            }
        };
    }
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: dataType === 'Grupo' ? 
                    `Gastos por Grupo - ${company}` : 
                    `Gastos do Grupo "${company === 'Vog' ? currentGroupVog : currentGroupAndrey}" - ${company}`,
                font: {
                    size: 20
                }
            },
            tooltip: {
                callbacks: commonTooltipCallbacks,
                displayColors: true,
                usePointStyle: true,
                bodyFont: {
                    size: 14
                },
                padding: 12,
                backgroundColor: 'rgba(0, 0, 0, 0.8)'
            },
            datalabels: {
                display: false
            }
        },
        scales: {
            x: {
                ticks: {
                    padding: 20 
                }
            },
            y: {
                type: isLogScale ? 'logarithmic' : 'linear',
                beginAtZero: !isLogScale,
                ticks: {
                    callback: function(value) {
                        return formatMoney(value);
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            intersect: false
        },
        elements: {
            line: {
                tension: 0.4
            }
        }
    };
}

function updateChartScale() {
    if (mainChartVog) {
        mainChartVog.options.scales.y.type = isLogScale ? 'logarithmic' : 'linear';
        mainChartVog.options.scales.y.beginAtZero = !isLogScale;
        mainChartVog.update();
    }
    if (mainChartAndrey) {
        mainChartAndrey.options.scales.y.type = isLogScale ? 'logarithmic' : 'linear';
        mainChartAndrey.options.scales.y.beginAtZero = !isLogScale;
        mainChartAndrey.update();
    }
    if (pieChartVog) pieChartVog.update();
    if (pieChartAndrey) pieChartAndrey.update();
}
function setupCommentListeners(chart, company) {
    chart.options.onClick = function(evt, elements) {
        if (elements.length > 0) {
            const element = elements[0];
            
            if (currentMode === 'comment') {
                // Modo Comentários - abre modal
                const point = {
                    label: this.data.labels[element.index],
                    datasetIndex: element.datasetIndex,
                    value: this.data.datasets[element.datasetIndex].data[element.index]
                };
                
                if (this.config.type === 'pie') {
                    point.label = this.data.labels[element.index];
                    point.value = this.data.datasets[0].data[element.index];
                    delete point.datasetIndex;
                }
                
                showAnnotationModal(this, company, point);
            } 
            else if (currentMode === 'fixedTooltip') {
                // Modo Fixar Tooltip - fixa o tooltip
                const chartType = this.config.type;
                fixedTooltips[company][chartType] = {
                    index: element.index,
                    datasetIndex: element.datasetIndex
                };
                this.update();
            }
            else {
                // Modo Dinâmico - navegação normal
                if (this.config.type === 'pie' && (company === 'Vog' ? !currentGroupVog : !currentGroupAndrey)) {
                    // Navega para setores do grupo clicado
                    const clickedGroup = this.data.labels[element.index];
                    if (company === 'Vog') {
                        currentGroupVog = clickedGroup;
                        showGroupSectors(currentGroupVog, 'Vog');
                    } else {
                        currentGroupAndrey = clickedGroup;
                        showGroupSectors(currentGroupAndrey, 'Andrey');
                    }
                } else if (this.config.type === 'line') {
                    // Navega para setores se for um grupo
                    const clickedDataset = this.data.datasets[element.datasetIndex];
                    if (clickedDataset.isGroup) {
                        if (company === 'Vog') {
                            currentGroupVog = clickedDataset.group;
                            showGroupSectors(currentGroupVog, 'Vog');
                        } else {
                            currentGroupAndrey = clickedDataset.group;
                            showGroupSectors(currentGroupAndrey, 'Andrey');
                        }
                    }
                }
            }
        }
    };
    
    // Configuração para tooltips customizados (fixos)
    chart.options.plugins.tooltip = {
        ...chart.options.plugins.tooltip,
        external: function(context) {
            if (currentMode === 'fixedTooltip') {
                const chart = context.chart;
                const company = chart.options.plugins.title?.text?.split(' - ').pop() || '';
                const chartType = chart.config.type;
                const fixedTooltip = fixedTooltips[company][chartType];
                
                if (fixedTooltip) {
                    const tooltipModel = chart.tooltip;
                    
                    if (tooltipModel) {
                        tooltipModel.setActiveElements([
                            {
                                datasetIndex: fixedTooltip.datasetIndex || 0,
                                index: fixedTooltip.index
                            }
                        ], { x: 0, y: 0 });
                        
                        tooltipModel.update();
                        return true;
                    }
                }
            }
            return false;
        }
    };
}

function showGroupSectors(group, company) {
    const mainChart = company === 'Vog' ? mainChartVog : mainChartAndrey;
    const pieChart = company === 'Vog' ? pieChartVog : pieChartAndrey;
    const sectorData = mainChart.sectorData;
    // Filtra os setores que pertencem ao grupo selecionado
    const sectorsInGroup = Object.keys(sectorData).filter(sector => sectorData[sector].group === group);
    
    // Atualiza o gráfico de linhas para mostrar os setores
    mainChart.data.datasets = sectorsInGroup.map((sector, index) => {
        return {
            label: sector,
            data: sectorData[sector].values,
            borderColor: sectorColors[index % sectorColors.length],
            backgroundColor: sectorColors[index % sectorColors.length],
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            group: group,
            isGroup: false,
            // Alteração aqui - habilitar datalabels para setores como nos grupos
            datalabels: {
                display: true,
                align: 'top',
                formatter: function(value) {
                    return formatMoney(value);
                },
                color: sectorColors[index % sectorColors.length],
                font: {
                    weight: 'bold',
                    size: 10
                }
            }
        };
    });

    // Atualiza o gráfico de pizza para mostrar a participação dos setores no grupo
    const sectorTotals = sectorsInGroup.map(sector => 
        sectorData[sector].values.reduce((a, b) => a + b, 0)
    );
    
    pieChart.data.labels = sectorsInGroup;
    pieChart.data.datasets = [{
        data: sectorTotals,
        backgroundColor: sectorsInGroup.map((sector, index) => sectorColors[index % sectorColors.length]),
        borderWidth: 1
    }];

    // Atualiza os títulos
    mainChart.options.plugins.title.text = `Gastos do Grupo "${group}" - ${company}`;
    pieChart.options.plugins.title.text = `Gastos por Setor - ${group} - ${company}`;

    // Mantém a configuração de tooltip com os comentários
    mainChart.options.plugins.tooltip.callbacks = getChartOptions('Setor', company).plugins.tooltip.callbacks;
    pieChart.options.plugins.tooltip.callbacks = getChartOptions('pie', company).plugins.tooltip.callbacks;

    // Atualiza os gráficos
    mainChart.update();
    pieChart.update();
    
    // Atualiza os gráficos com as anotações
    updateChartWithAnnotations(mainChart, company);
    updateChartWithAnnotations(pieChart, company);

    // Atualiza os botões de voltar
    document.getElementById(`backButton${company}`).style.display = 'block';
}

function showAllGroups(company) {
    const mainChart = company === 'Vog' ? mainChartVog : mainChartAndrey;
    const pieChart = company === 'Vog' ? pieChartVog : pieChartAndrey;
    const sectorData = mainChart.sectorData;

    // Reseta as variáveis de grupo atual
    if (company === 'Vog') {
        currentGroupVog = null;
    } else {
        currentGroupAndrey = null;
    }

    // Reorganiza os dados por grupo
    const groupData = {};
    Object.keys(sectorData).forEach(sector => {
        const group = sectorData[sector].group;
        if (!groupData[group]) {
            groupData[group] = sectorData[sector].values.map(() => 0);
        }
        sectorData[sector].values.forEach((value, index) => {
            groupData[group][index] += value;
        });
    });

    const groupNames = Object.keys(groupData);
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
        .slice(0, groupData[groupNames[0]].length);

    // Atualiza o gráfico de linhas
    mainChart.data.labels = months;
    mainChart.data.datasets = groupNames.map((group, index) => {
        return {
            label: group,
            data: groupData[group],
            borderColor: groupColors[index % groupColors.length],
            backgroundColor: groupColors[index % groupColors.length],
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            group: group,
            isGroup: true,
            datalabels: {
                display: true,
                align: 'top',
                formatter: formatMoney,
                color: groupColors[index % groupColors.length],
                font: {
                    weight: 'bold',
                    size: 10
                }
            }
        };
    });

    // Atualiza o gráfico de pizza
    const groupTotals = groupNames.map(group => 
        groupData[group].reduce((a, b) => a + b, 0)
    );
    
    pieChart.data.labels = groupNames;
    pieChart.data.datasets = [{
        data: groupTotals,
        backgroundColor: groupNames.map((group, index) => groupColors[index % groupColors.length]),
        borderWidth: 1
    }];

    // Restaura os títulos originais
    mainChart.options.plugins.title.text = `Gastos por Grupo - ${company}`;
    pieChart.options.plugins.title.text = `Gastos por Grupo - ${company}`;

    // Garante que as configurações de tooltip com comentários sejam mantidas
    mainChart.options.plugins.tooltip.callbacks = getChartOptions('Grupo', company).plugins.tooltip.callbacks;
    pieChart.options.plugins.tooltip.callbacks = getChartOptions('pie', company).plugins.tooltip.callbacks;

    // Atualiza os gráficos
    mainChart.update();
    pieChart.update();

    // Aplica as anotações existentes
    updateChartWithAnnotations(mainChart, company);
    updateChartWithAnnotations(pieChart, company);

    // Esconde o botão de voltar
    document.getElementById(`backButton${company}`).style.display = 'none';

    // Restaura os event listeners de comentários
    setupCommentListeners(mainChart, company);
    setupCommentListeners(pieChart, company);
}

// Adiciona funcionalidade de exportar para PDF
// Adiciona funcionalidade de exportar para PDF com seleção de gráficos
document.getElementById('exportPdf').addEventListener('click', function() {
    // Cria um modal para seleção de gráficos
    const selectionModal = document.createElement('div');
    selectionModal.style.position = 'fixed';
    selectionModal.style.top = '0';
    selectionModal.style.left = '0';
    selectionModal.style.width = '100%';
    selectionModal.style.height = '100%';
    selectionModal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    selectionModal.style.zIndex = '10000';
    selectionModal.style.display = 'flex';
    selectionModal.style.justifyContent = 'center';
    selectionModal.style.alignItems = 'center';
    
    // Conteúdo do modal
    selectionModal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 5px; max-width: 500px; width: 90%;">
            <h2 style="margin-top: 0;">Selecione os gráficos para exportar</h2>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px;">
                    <input type="checkbox" id="exportVogLine" checked> Gráfico de Linha - Vog
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    <input type="checkbox" id="exportVogPie" checked> Gráfico de Pizza - Vog
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    <input type="checkbox" id="exportAndreyLine" checked> Gráfico de Linha - Andrey
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    <input type="checkbox" id="exportAndreyPie" checked> Gráfico de Pizza - Andrey
                </label>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <button id="cancelExport" style="padding: 8px 15px; background: #ccc; border: none; border-radius: 4px;">Cancelar</button>
                <button id="confirmExport" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px;">Exportar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(selectionModal);
    
    // Evento para cancelar
    document.getElementById('cancelExport').addEventListener('click', function() {
        document.body.removeChild(selectionModal);
    });
    
    // Evento para confirmar exportação
    document.getElementById('confirmExport').addEventListener('click', function() {
        const selectedCharts = {
            vogLine: document.getElementById('exportVogLine').checked,
            vogPie: document.getElementById('exportVogPie').checked,
            andreyLine: document.getElementById('exportAndreyLine').checked,
            andreyPie: document.getElementById('exportAndreyPie').checked
        };
        
        document.body.removeChild(selectionModal);
        
        // Verifica se pelo menos um gráfico foi selecionado
        if (!selectedCharts.vogLine && !selectedCharts.vogPie && 
            !selectedCharts.andreyLine && !selectedCharts.andreyPie) {
            alert('Por favor, selecione pelo menos um gráfico para exportar.');
            return;
        }
        
        // Carrega as bibliotecas necessárias se não estiverem disponíveis
        if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
            const script1 = document.createElement('script');
            script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script1.onload = function() {
                const script2 = document.createElement('script');
                script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script2.onload = function() {
                    exportSelectedToPdf(selectedCharts);
                };
                document.head.appendChild(script2);
            };
            document.head.appendChild(script1);
        } else {
            exportSelectedToPdf(selectedCharts);
        }
    });
});

function exportSelectedToPdf(selectedCharts) {
    const { jsPDF } = window.jspdf;
    const controls = document.getElementById('chartControls');
    const originalDisplay = controls.style.display;
    
    // Esconde os controles
    controls.style.display = 'none';
    
    // Adiciona overlay de carregamento
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingOverlay.style.color = 'white';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '9999';
    loadingOverlay.innerHTML = '<h2>Gerando PDF, por favor aguarde...</h2>';
    document.body.appendChild(loadingOverlay);
    
    // Cria um novo PDF em orientação vertical
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
    });
    
    // Lista de gráficos a serem capturados (filtrada pela seleção)
    const charts = [];
    if (selectedCharts.vogLine) charts.push({ id: 'mainChartVog', title: 'Empresa Vog - Gráfico de Linha' });
    if (selectedCharts.vogPie) charts.push({ id: 'pieChartVog', title: 'Empresa Vog - Gráfico de Pizza' });
    if (selectedCharts.andreyLine) charts.push({ id: 'mainChartAndrey', title: 'Empresa Andrey - Gráfico de Linha' });
    if (selectedCharts.andreyPie) charts.push({ id: 'pieChartAndrey', title: 'Empresa Andrey - Gráfico de Pizza' });
    
    // Função para capturar cada gráfico individualmente
    async function captureChart(chartId, title, index) {
        const canvas = document.getElementById(chartId);
        
        // Cria um novo canvas com os dados do gráfico
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const ctx = newCanvas.getContext('2d');
        
        // Preenche o fundo com branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        
        // Copia o conteúdo do gráfico original
        ctx.drawImage(canvas, 0, 0);
        
        // Converte para imagem
        const imageData = newCanvas.toDataURL('image/png');
        
        // Adiciona nova página se necessário (a cada gráfico)
        if (index > 0) {
            pdf.addPage();
        }
        
        // Primeira página - adiciona título principal
        if (index === 0) {
            pdf.setFontSize(16);
            pdf.text('Relatório de Gastos por Grupo e Setor', 105, 15, { align: 'center' });
        }
        
        // Posição Y na página
        const yPosition = 25;
        
        // Adiciona título do gráfico
        pdf.setFontSize(10);
        pdf.text(title, 105, yPosition - 5, { align: 'center' });
        
        // Calcula dimensões para caber na página
        const pageWidth = pdf.internal.pageSize.getWidth() - 20;
        const aspectRatio = canvas.height / canvas.width;
        const imgHeight = pageWidth * aspectRatio;
        
        // Adiciona a imagem ao PDF
        pdf.addImage(imageData, 'PNG', 10, yPosition, pageWidth, imgHeight);
    }
    
    // Processa todos os gráficos selecionados
    async function processAllCharts() {
        try {
            for (let i = 0; i < charts.length; i++) {
                await captureChart(charts[i].id, charts[i].title, i);
            }
            
            // Finaliza o processo
            document.body.removeChild(loadingOverlay);
            controls.style.display = originalDisplay;
            pdf.save('grafico_gastos_selecionados.pdf');
            
            // Redesenha os gráficos
            setTimeout(redrawAllCharts, 500);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            document.body.removeChild(loadingOverlay);
            controls.style.display = originalDisplay;
            setTimeout(redrawAllCharts, 500);
            alert('Erro ao gerar PDF. Verifique o console para detalhes.');
        }
    }

    // Dá um pequeno delay para garantir que os gráficos estão renderizados
    setTimeout(processAllCharts, 1000);
}

function redrawAllCharts() {
    if (mainChartVog) mainChartVog.update();
    if (mainChartAndrey) mainChartAndrey.update();
    if (pieChartVog) pieChartVog.update();
    if (pieChartAndrey) pieChartAndrey.update();
}

function exportToPdf() {
    const { jsPDF } = window.jspdf;
    const controls = document.getElementById('chartControls');
    const originalDisplay = controls.style.display;
    
    // Esconde os controles
    controls.style.display = 'none';
    
    // Adiciona overlay de carregamento
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingOverlay.style.color = 'white';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '9999';
    loadingOverlay.innerHTML = '<h2>Gerando PDF, por favor aguarde...</h2>';
    document.body.appendChild(loadingOverlay);
    
    // Cria um novo PDF em orientação vertical
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
    });
    
    // Lista de gráficos a serem capturados
    const charts = [
        { id: 'mainChartVog', title: 'Empresa Vog - Gráfico de Linha' },
        { id: 'pieChartVog', title: 'Empresa Vog - Gráfico de Pizza' },
        { id: 'mainChartAndrey', title: 'Empresa Andrey - Gráfico de Linha' },
        { id: 'pieChartAndrey', title: 'Empresa Andrey - Gráfico de Pizza' }
    ];
    
    // Função para capturar cada gráfico individualmente
    async function captureChart(chartId, title, index) {
        const canvas = document.getElementById(chartId);
        
        // Cria um novo canvas com os dados do gráfico
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const ctx = newCanvas.getContext('2d');
        
        // Preenche o fundo com branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        
        // Copia o conteúdo do gráfico original
        ctx.drawImage(canvas, 0, 0);
        
        // Converte para imagem
        const imageData = newCanvas.toDataURL('image/png');
        
        // Adiciona nova página se necessário (a cada dois gráficos)
        if (index % 2 === 0 && index > 0) {
            pdf.addPage();
        } else if (index === 0) {
            // Primeira página - adiciona título principal
            pdf.setFontSize(16);
            pdf.text('Relatório de Gastos por Grupo e Setor', 105, 15, { align: 'center' });
        }
        
        // Posição Y na página (alterna entre topo e meio)
        const yPosition = index % 2 === 0 ? 25 : (pdf.internal.pageSize.getHeight() / 2) + 5;
        
        // Adiciona título do gráfico
        pdf.setFontSize(10);
        pdf.text(title, 105, yPosition - 5, { align: 'center' });
        
        // Calcula dimensões para caber na página
        const pageWidth = pdf.internal.pageSize.getWidth() - 20;
        const aspectRatio = canvas.height / canvas.width;
        const imgHeight = pageWidth * aspectRatio;
        
        // Adiciona a imagem ao PDF
        pdf.addImage(imageData, 'PNG', 10, yPosition, pageWidth, imgHeight);
    }
    
 
    // No final da função processAllCharts(), adicione:
    async function processAllCharts() {
        try {
            for (let i = 0; i < charts.length; i++) {
                await captureChart(charts[i].id, charts[i].title, i);
            }
            
            // Finaliza o processo
            document.body.removeChild(loadingOverlay);
            controls.style.display = originalDisplay;
            pdf.save('grafico_gastos_organizado.pdf');
            
            // Redesenha os gráficos
            setTimeout(redrawAllCharts, 500);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            document.body.removeChild(loadingOverlay);
            controls.style.display = originalDisplay;
            setTimeout(redrawAllCharts, 500);
            alert('Erro ao gerar PDF. Verifique o console para detalhes.');
        }
    }

    // Dá um pequeno delay para garantir que os gráficos estão renderizados
    setTimeout(processAllCharts, 1000);
}
document.getElementById('exportImage').addEventListener('click', function() {
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = exportToImage;
        document.head.appendChild(script);
    } else {
        exportToImage();
    }
});

function exportToImage() {
    // Ocultar os botões de voltar temporariamente
    const backButtonVog = document.getElementById('backButtonVog');
    const backButtonAndrey = document.getElementById('backButtonAndrey');
    const originalDisplayVog = backButtonVog.style.display;
    const originalDisplayAndrey = backButtonAndrey.style.display;
    
    backButtonVog.style.display = 'none';
    backButtonAndrey.style.display = 'none';
    
    // Adiciona overlay de carregamento
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingOverlay.style.color = 'white';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '9999';
    loadingOverlay.innerHTML = '<h2>Gerando Imagem, por favor aguarde...</h2>';
    document.body.appendChild(loadingOverlay);
    
    // Capturar o elemento que contém os gráficos
    const element = document.getElementById('chartContainer');
    
    // Usar html2canvas para capturar o elemento como imagem
     html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        // Remover overlay e restaurar botões
        document.body.removeChild(loadingOverlay);
        backButtonVog.style.display = originalDisplayVog;
        backButtonAndrey.style.display = originalDisplayAndrey;
        // Criar um link para download da imagem
        const link = document.createElement('a');
        link.download = 'grafico-gastos.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        setTimeout(redrawAllCharts, 500);
    }).catch(error => {
        console.error('Erro ao gerar imagem:', error);
        document.body.removeChild(loadingOverlay);
        backButtonVog.style.display = originalDisplayVog;
        backButtonAndrey.style.display = originalDisplayAndrey;
        alert('Erro ao gerar imagem. Verifique o console para detalhes.');
        setTimeout(redrawAllCharts, 500);
    });
}

document.getElementById('printPage').addEventListener('click', function() {
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = printPage;
        document.head.appendChild(script);
    } else {
        printPage();
    }
});

function printPage() {
    const chartContainer = document.getElementById('chartContainer');
    const controls = document.getElementById('chartControls');
    const originalDisplay = controls.style.display;
    
    // Esconde os controles
    controls.style.display = 'none';
    
    // Adiciona overlay de carregamento
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingOverlay.style.color = 'white';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '9999';
    loadingOverlay.innerHTML = '<h2>Preparando para impressão, por favor aguarde...</h2>';
    document.body.appendChild(loadingOverlay);
    
    // Configura estilos temporários para impressão
    const originalStyles = {
        bodyOverflow: document.body.style.overflow,
        containerDisplay: chartContainer.style.display,
        containerOverflow: chartContainer.style.overflow
    };
    
    document.body.style.overflow = 'visible';
    chartContainer.style.display = 'block';
    chartContainer.style.overflow = 'visible';
    
    // Captura cada empresa separadamente
    const companyContainers = document.querySelectorAll('.company-container');
    
    // Cria um iframe oculto para impressão
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.left = '-9999px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const printPromises = Array.from(companyContainers).map((container, index) => {
        return new Promise((resolve) => {
            html2canvas(container, {
                scale: 1,
                logging: false,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: container.scrollWidth,
                windowHeight: container.scrollHeight
            }).then(canvas => {
                resolve({
                    image: canvas.toDataURL('image/png'),
                    title: container.querySelector('.company-title').textContent
                });
            });
        });
    });
    
    Promise.all(printPromises).then(results => {
        // Prepara o conteúdo HTML para impressão
        let printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Gráfico de Gastos</title>
                <style>
                    @page {
                        size: auto;
                        margin: 10mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
                    .print-page {
                        page-break-after: always;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .print-page:last-child {
                        page-break-after: auto;
                    }
                    .print-title {
                        text-align: center;
                        font-size: 18px;
                        margin-bottom: 10px;
                    }
                    .print-image {
                        width: 100%;
                        height: auto;
                        max-width: 100%;
                        page-break-inside: avoid;
                    }
                    .chart-pair {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                        page-break-inside: avoid;
                    }
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                    }
                </style>
            </head>
            <body>
        `;
        
        // Adiciona cada empresa como uma página separada
        results.forEach((company, index) => {
            printHTML += `
                <div class="print-page">
                    <div class="chart-pair">
                        <img class="print-image" src="${company.image}" />
                    </div>
                </div>
            `;
        });
        
        printHTML += `</body></html>`;
        
        // Escreve no iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(printHTML);
        iframeDoc.close();
        
        iframe.onload = function() {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Restaura os estilos originais e remove o iframe
                setTimeout(() => {
                    document.body.style.overflow = originalStyles.bodyOverflow;
                    chartContainer.style.display = originalStyles.containerDisplay;
                    chartContainer.style.overflow = originalStyles.containerOverflow;
                    controls.style.display = originalDisplay;
                    document.body.removeChild(iframe);
                    document.body.removeChild(loadingOverlay);
                    
                    // Redesenha os gráficos
                    redrawAllCharts();
                }, 1000);
            }, 500);
        };
    }).catch(error => {
        console.error('Erro ao gerar impressão:', error);
        document.body.removeChild(loadingOverlay);
        controls.style.display = originalDisplay;
        alert('Erro ao gerar impressão. Verifique o console para detalhes.');
        setTimeout(redrawAllCharts, 500);
    });
}
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        redrawAllCharts();
    }
});