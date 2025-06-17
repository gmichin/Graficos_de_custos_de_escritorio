// Adicione os event listeners para os botões de voltar
document.getElementById('backButtonVog').addEventListener('click', function() {
    showAllGroups('Vog');
});

document.getElementById('backButtonAndrey').addEventListener('click', function() {
    showAllGroups('Andrey');
});

// Variáveis globais
let commentMode = true;
let annotations = {
    Vog: { line: {}, pie: {} },
    Andrey: { line: {}, pie: {} }
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

// Event listeners para o modal
document.getElementById('toggleCommentMode').addEventListener('click', function() {
    commentMode = !commentMode;
    this.textContent = commentMode ? 'Desativar Modo Comentário' : 'Ativar Modo Comentário';
    
    // Feedback visual
    const feedback = document.createElement('div');
    feedback.textContent = `Modo Comentário ${commentMode ? 'ativado' : 'desativado'}`;
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

closeBtn.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

saveAnnotationBtn.addEventListener('click', saveAnnotation);

// Função para mostrar o modal de anotação
function showAnnotationModal(chart, company, point) {
    currentAnnotationPoint = point;
    currentAnnotationChart = chart;
    currentAnnotationCompany = company;
    
    // Limpa o textarea
    annotationText.value = '';
    
    // Carrega anotações existentes
    loadAnnotationsForPoint();
    
    modal.style.display = 'block';
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
    
    const chartType = currentAnnotationChart.config.type === 'line' ? 'line' : 'pie';
    const pointKey = currentAnnotationChart.config.type === 'line' ? 
        `${currentAnnotationPoint.label}-${currentAnnotationPoint.datasetIndex}` : 
        currentAnnotationPoint.label;
    
    if (!annotations[currentAnnotationCompany][chartType][pointKey]) {
        annotations[currentAnnotationCompany][chartType][pointKey] = [];
    }
    
    annotations[currentAnnotationCompany][chartType][pointKey].push(note);
    
    // Atualiza a lista de anotações
    loadAnnotationsForPoint();
    
    // Limpa o textarea
    annotationText.value = '';
    
    // Atualiza o gráfico para mostrar que tem anotação
    updateChartWithAnnotations(currentAnnotationChart, currentAnnotationCompany);
}

// Função para deletar anotação
window.deleteAnnotation = function(index) {
    const chartType = currentAnnotationChart.config.type === 'line' ? 'line' : 'pie';
    const pointKey = currentAnnotationChart.config.type === 'line' ? 
        `${currentAnnotationPoint.label}-${currentAnnotationPoint.datasetIndex}` : 
        currentAnnotationPoint.label;
    
    annotations[currentAnnotationCompany][chartType][pointKey].splice(index, 1);
    loadAnnotationsForPoint();
    updateChartWithAnnotations(currentAnnotationChart, currentAnnotationCompany);
}

// Função para atualizar o gráfico com marcadores de anotação
function updateChartWithAnnotations(chart, company) {
    const chartType = chart.config.type === 'line' ? 'line' : 'pie';
    const companyAnnotations = annotations[company][chartType];
    
    if (chart.config.type === 'line') {
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            dataset.pointBackgroundColor = dataset.data.map((value, index) => {
                const pointKey = `${chart.data.labels[index]}-${datasetIndex}`;
                return companyAnnotations[pointKey] && companyAnnotations[pointKey].length > 0 ? 
                    'black' : dataset.backgroundColor;
            });
        });
    } else {
        chart.data.datasets.forEach(dataset => {
            dataset.backgroundColor = dataset.data.map((value, index) => {
                const pointKey = chart.data.labels[index];
                return groupColors[index % groupColors.length];
            });
            dataset.borderColor = dataset.data.map((value, index) => {
                const pointKey = chart.data.labels[index];
                return companyAnnotations[pointKey] && companyAnnotations[pointKey].length > 0 ? 
                    'black' : 'transparent';
            });
            dataset.borderWidth = 3;
        });
    }
    
    chart.update();
}

// Função para formatar valores monetários
function formatMoney(value) {
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
    
    const { vogData, andreyData } = parseData(rawData);
    
    // Mostra o container principal e os controles
    document.getElementById('chartContainer').style.display = 'block';
    document.getElementById('chartControls').style.display = 'flex';
    
    createCharts(vogData, andreyData);
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
    let monthsCount = 0;
    
    // Primeiro, determinamos quantos meses temos
    for (const line of lines) {
        if (line.includes('Janeiro')) {
            const parts = line.split('\t');
            monthsCount = parts.filter(part => part.trim() !== '').length - 2;
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
            const values = [];
            
            // Processa os valores dos meses
            for (let i = 2; i < Math.min(parts.length, 2 + monthsCount); i++) {
                if (parts[i].trim() === 'R$ -' || parts[i].trim() === '-') {
                    values.push(0); // Trata valores vazios como zero
                } else {
                    const num = parts[i].replace('R$', '').trim()
                        .replace(/\./g, '').replace(',', '.');
                    values.push(parseFloat(num) || 0); // Se não converter, usa zero
                }
            }
            
            // Completa com zeros se faltarem meses no final
            while (values.length < monthsCount) {
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
    
    return { vogData, andreyData };
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
function createCharts(vogData, andreyData) {
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
    createCompanyCharts('Vog', vogOrganized);
    // Cria gráficos para Andrey
    createCompanyCharts('Andrey', andreyOrganized);

    setupChartResizeHandlers();
}

// Função para criar gráficos de uma empresa específica
function createCompanyCharts(company, organizedData) {
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
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].slice(0, Object.values(groupData)[0].length);
    
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
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Gastos por Grupo - ${company}`,
                    font: {
                        size: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatMoney(value)} (${percentage}%)`;
                        }
                    }
                },
                // Adicione este plugin para mostrar os valores na pizza
                datalabels: {
                    formatter: (value, ctx) => {
                        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${percentage}%`;
                    },
                    color: '#000',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    anchor: 'center',
                    align: 'center'
                }
            },
            onClick: function(evt, elements) {
                if (elements.length > 0 && (company === 'Vog' ? !currentGroupVog : !currentGroupAndrey)) {
                    const clickedIndex = elements[0].index;
                    const clickedGroup = this.data.labels[clickedIndex];
                    if (company === 'Vog') {
                        currentGroupVog = clickedGroup;
                        showGroupSectors(currentGroupVog, 'Vog');
                    } else {
                        currentGroupAndrey = clickedGroup;
                        showGroupSectors(currentGroupAndrey, 'Andrey');
                    }
                }
            }
        },
        // Adicione esta linha para habilitar os plugins
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

    // No createCompanyCharts, substitua o onClick do pieChart por:
    pieChart.options.onClick = function(evt, elements) {
        if (elements.length > 0) {
            if (commentMode) {
                const point = {
                    label: this.data.labels[elements[0].index],
                    value: this.data.datasets[0].data[elements[0].index]
                };
                showAnnotationModal(this, company, point);
            } else if ((company === 'Vog' ? !currentGroupVog : !currentGroupAndrey)) {
                const clickedIndex = elements[0].index;
                const clickedGroup = this.data.labels[clickedIndex];
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
    updateChartWithAnnotations(lineChart, company);
    updateChartWithAnnotations(pieChart, company);
}

function getChartOptions(dataType, company) {
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
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${formatMoney(context.raw)}`;
                    }
                }
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
        },
        onClick: function(evt, elements) {
            if (elements.length > 0) {
                const clickedDatasetIndex = elements[0].datasetIndex;
                const clickedDataset = this.data.datasets[clickedDatasetIndex];
                
                if (commentMode) {
                    const point = {
                        label: this.data.labels[elements[0].index],
                        datasetIndex: elements[0].datasetIndex,
                        value: this.data.datasets[elements[0].datasetIndex].data[elements[0].index]
                    };
                    showAnnotationModal(this, company, point);
                } else if (clickedDataset.isGroup) {
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

function showGroupSectors(groupName, company) {
    const sectorData = company === 'Vog' ? mainChartVog.sectorData : mainChartAndrey.sectorData;
    const lineChart = company === 'Vog' ? mainChartVog : mainChartAndrey;
    const pieChart = company === 'Vog' ? pieChartVog : pieChartAndrey;
    
    const groupSectors = Object.entries(sectorData)
        .filter(([sector, data]) => data.group === groupName)
        .map(([sector, data]) => ({sector, values: data.values}));
    
    const newLineDatasets = groupSectors.map((sector, index) => {
        return {
            label: sector.sector,
            data: sector.values,
            borderColor: sectorColors[index % sectorColors.length],
            backgroundColor: sectorColors[index % sectorColors.length], // Cor para os pontos
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            group: groupName,
            isGroup: false,
            // Adiciona rótulos para os setores
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
    
    lineChart.data.datasets = newLineDatasets;
    lineChart.options = getChartOptions('Setor', company);
    lineChart.update();
    
    pieChart.data.labels = groupSectors.map(s => s.sector);
    pieChart.data.datasets[0].data = groupSectors.map(s => 
        s.values.reduce((a, b) => a + b, 0)
    );
    pieChart.data.datasets[0].backgroundColor = groupSectors.map((s, i) => 
        sectorColors[i % sectorColors.length]
    );
    pieChart.options.plugins.title.text = `Gastos do Grupo - ${groupName} (${company})`;
    pieChart.options.plugins.datalabels.formatter = (value, ctx) => {
        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage = Math.round((value / total) * 100);
        return `${percentage}%`;
    };
    pieChart.update();
    
    // Mostra o botão "Voltar para Grupos" apropriado
    if (company === 'Vog') {
        document.getElementById('backButtonVog').style.display = 'block';
    } else {
        document.getElementById('backButtonAndrey').style.display = 'block';
    }
}

function showAllGroups(company) {
    const lineChart = company === 'Vog' ? mainChartVog : mainChartAndrey;
    const pieChart = company === 'Vog' ? pieChartVog : pieChartAndrey;
    const sectorData = company === 'Vog' ? mainChartVog.sectorData : mainChartAndrey.sectorData;
    
    // Reorganiza os dados do grupo
    const groupData = {};
    Object.values(sectorData).forEach(sector => {
        if (!groupData[sector.group]) {
            groupData[sector.group] = sector.values.map(() => 0);
        }
        sector.values.forEach((value, index) => {
            groupData[sector.group][index] += value;
        });
    });
    
    const groupNames = Object.keys(groupData);
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].slice(0, Object.values(groupData)[0].length);
    
    // Atualiza o gráfico de linhas
    const newLineDatasets = groupNames.map((group, index) => {
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
    
    lineChart.data.datasets = newLineDatasets;
    lineChart.data.labels = months;
    lineChart.options = getChartOptions('Grupo', company);
    lineChart.update();
    
    // Atualiza o gráfico de pizza
    const groupTotals = {};
    groupNames.forEach(group => {
        groupTotals[group] = groupData[group].reduce((a, b) => a + b, 0);
    });
    
    pieChart.data.labels = groupNames;
    pieChart.data.datasets[0].data = groupNames.map(group => groupTotals[group]);
    pieChart.data.datasets[0].backgroundColor = groupNames.map((group, index) => 
        groupColors[index % groupColors.length]
    );
    pieChart.options.plugins.title.text = `Distribuição por Grupo - ${company}`;
    pieChart.update();
    
    if (company === 'Vog') {
        currentGroupVog = null;
        document.getElementById('backButtonVog').style.display = 'none';
    } else {
        currentGroupAndrey = null;
        document.getElementById('backButtonAndrey').style.display = 'none';
    }
}

// Adiciona funcionalidade de exportar para PDF
document.getElementById('exportPdf').addEventListener('click', function() {
    if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script1.onload = function() {
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script2.onload = exportToPdf;
            document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    } else {
        exportToPdf();
    }
});

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