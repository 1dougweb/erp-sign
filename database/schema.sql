-- Sistema Todo List e Cronograma de Instalação
-- Schema MySQL

CREATE DATABASE IF NOT EXISTS todo_instalacao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE todo_instalacao;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS projetos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    projeto_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    ordem INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
    INDEX idx_projeto_ordem (projeto_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de todos (subtarefas)
CREATE TABLE IF NOT EXISTS todos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tarefa_id INT NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    concluido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cargo VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tipos de instalação
CREATE TABLE IF NOT EXISTS tipos_instalacao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS equipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    tipo_instalacao_id INT,
    descricao TEXT,
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_instalacao_id) REFERENCES tipos_instalacao(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relação equipe-funcionário
CREATE TABLE IF NOT EXISTS equipe_funcionarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipe_id INT NOT NULL,
    funcionario_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_equipe_funcionario (equipe_id, funcionario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de categorias de materiais
CREATE TABLE IF NOT EXISTS categorias_material (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de unidades de medida
CREATE TABLE IF NOT EXISTS unidades_medida (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    simbolo VARCHAR(20) NOT NULL,
    tipo ENUM('unidade', 'area', 'peso', 'volume', 'comprimento') DEFAULT 'unidade',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    contato VARCHAR(255),
    avaliacao DECIMAL(3, 2) DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de locais/almoxarifados
CREATE TABLE IF NOT EXISTS estoque_locais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    responsavel_id INT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsavel_id) REFERENCES funcionarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de materiais (expandida)
CREATE TABLE IF NOT EXISTS materiais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo ENUM('material', 'ferramenta') DEFAULT 'material',
    categoria_id INT,
    fornecedor_id INT,
    unidade_medida_id INT,
    quantidade_estoque DECIMAL(10, 2) DEFAULT 0,
    estoque_minimo DECIMAL(10, 2) DEFAULT 0,
    estoque_maximo DECIMAL(10, 2) DEFAULT 0,
    ponto_reposicao DECIMAL(10, 2) DEFAULT 0,
    valor_unitario DECIMAL(10, 2) DEFAULT 0,
    valor_total_estoque DECIMAL(10, 2) DEFAULT 0,
    localizacao VARCHAR(255),
    codigo_barras VARCHAR(100),
    codigo_interno VARCHAR(100),
    unidade VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_material(id) ON DELETE SET NULL,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL,
    FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id) ON DELETE SET NULL,
    INDEX idx_categoria (categoria_id),
    INDEX idx_fornecedor (fornecedor_id),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de conversão de unidades por material
CREATE TABLE IF NOT EXISTS material_unidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    unidade_id INT NOT NULL,
    fator_conversao DECIMAL(10, 4) NOT NULL DEFAULT 1,
    unidade_base BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    FOREIGN KEY (unidade_id) REFERENCES unidades_medida(id) ON DELETE CASCADE,
    UNIQUE KEY unique_material_unidade (material_id, unidade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de preços de materiais (módulo de impressão)
CREATE TABLE IF NOT EXISTS material_precos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    tipo_calculo ENUM('impressao_cm2', 'corte_cm2', 'outro') DEFAULT 'impressao_cm2',
    valor_por_cm2 DECIMAL(10, 4) NOT NULL DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    UNIQUE KEY unique_material_tipo (material_id, tipo_calculo),
    INDEX idx_material_ativo (material_id, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de carros
CREATE TABLE IF NOT EXISTS carros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100),
    ano INT,
    disponivel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de orçamentos (integração)
CREATE TABLE IF NOT EXISTS orcamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(50) UNIQUE NOT NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_endereco TEXT,
    tipo_trabalho VARCHAR(255),
    valor DECIMAL(10, 2),
    observacoes TEXT,
    status ENUM('pendente', 'aprovado', 'em_andamento', 'concluido', 'cancelado') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orcamento_id INT NOT NULL,
    material_id INT NOT NULL,
    descricao_trabalho TEXT,
    metragem_cm2 DECIMAL(10, 2) NOT NULL DEFAULT 0,
    valor_unitario DECIMAL(10, 4) NOT NULL DEFAULT 0,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    INDEX idx_orcamento_ordem (orcamento_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    tipo ENUM('entrada', 'saida', 'transferencia', 'ajuste', 'devolucao', 'perda', 'quebra') NOT NULL,
    quantidade DECIMAL(10, 2) NOT NULL,
    unidade_id INT,
    valor_unitario DECIMAL(10, 2) DEFAULT 0,
    valor_total DECIMAL(10, 2) DEFAULT 0,
    fornecedor_id INT,
    origem_id INT,
    destino_id INT,
    usuario_id INT NOT NULL,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    documento_referencia VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    FOREIGN KEY (unidade_id) REFERENCES unidades_medida(id) ON DELETE SET NULL,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL,
    FOREIGN KEY (origem_id) REFERENCES estoque_locais(id) ON DELETE SET NULL,
    FOREIGN KEY (destino_id) REFERENCES estoque_locais(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_material (material_id),
    INDEX idx_tipo (tipo),
    INDEX idx_data (data_movimentacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de requisições de materiais
CREATE TABLE IF NOT EXISTS requisicoes_materiais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(50) UNIQUE NOT NULL,
    solicitante_id INT NOT NULL,
    aprovador_id INT,
    projeto_id INT,
    orcamento_id INT,
    cronograma_id INT,
    status ENUM('pendente', 'aprovada', 'rejeitada', 'atendida', 'cancelada') DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP NULL,
    data_atendimento TIMESTAMP NULL,
    justificativa TEXT NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitante_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (aprovador_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL,
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE SET NULL,
    FOREIGN KEY (cronograma_id) REFERENCES cronograma_instalacao(id) ON DELETE SET NULL,
    INDEX idx_solicitante (solicitante_id),
    INDEX idx_status (status),
    INDEX idx_data (data_solicitacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de itens de requisição
CREATE TABLE IF NOT EXISTS requisicao_itens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requisicao_id INT NOT NULL,
    material_id INT NOT NULL,
    quantidade_solicitada DECIMAL(10, 2) NOT NULL,
    quantidade_atendida DECIMAL(10, 2) DEFAULT 0,
    unidade_id INT,
    justificativa_item TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requisicao_id) REFERENCES requisicoes_materiais(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    FOREIGN KEY (unidade_id) REFERENCES unidades_medida(id) ON DELETE SET NULL,
    INDEX idx_requisicao (requisicao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de equipamentos e ferramentas (separado)
CREATE TABLE IF NOT EXISTS equipamentos_ferramentas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo ENUM('equipamento', 'ferramenta') NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    patrimonio VARCHAR(100),
    localizacao VARCHAR(255),
    status ENUM('disponivel', 'em_uso', 'manutencao', 'indisponivel') DEFAULT 'disponivel',
    valor_aquisicao DECIMAL(10, 2) DEFAULT 0,
    data_aquisicao DATE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de movimentações de equipamentos
CREATE TABLE IF NOT EXISTS equipamento_movimentacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipamento_id INT NOT NULL,
    tipo ENUM('emprestimo', 'devolucao', 'manutencao', 'baixa') NOT NULL,
    funcionario_id INT,
    usuario_id INT NOT NULL,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_prevista_devolucao TIMESTAMP NULL,
    data_devolucao TIMESTAMP NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos_ferramentas(id) ON DELETE CASCADE,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_equipamento (equipamento_id),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de alertas de estoque
CREATE TABLE IF NOT EXISTS estoque_alertas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    tipo_alerta ENUM('estoque_minimo', 'estoque_zero', 'validade_proxima') NOT NULL,
    nivel VARCHAR(50),
    data_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visualizado BOOLEAN DEFAULT FALSE,
    resolvido BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    INDEX idx_material (material_id),
    INDEX idx_visualizado (visualizado),
    INDEX idx_resolvido (resolvido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de inventários físicos
CREATE TABLE IF NOT EXISTS inventario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data_inventario DATE NOT NULL,
    local_id INT,
    usuario_id INT NOT NULL,
    status ENUM('em_andamento', 'concluido') DEFAULT 'em_andamento',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (local_id) REFERENCES estoque_locais(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de itens do inventário
CREATE TABLE IF NOT EXISTS inventario_itens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventario_id INT NOT NULL,
    material_id INT NOT NULL,
    quantidade_sistema DECIMAL(10, 2) NOT NULL,
    quantidade_fisica DECIMAL(10, 2) NOT NULL,
    diferenca DECIMAL(10, 2) DEFAULT 0,
    ajustado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventario_id) REFERENCES inventario(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    INDEX idx_inventario (inventario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de cronograma de instalação
CREATE TABLE IF NOT EXISTS cronograma_instalacao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orcamento_id INT,
    data_instalacao DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    endereco TEXT NOT NULL,
    observacoes TEXT,
    status ENUM('agendado', 'em_andamento', 'concluido', 'cancelado') DEFAULT 'agendado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relação cronograma-equipe
CREATE TABLE IF NOT EXISTS cronograma_equipe (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cronograma_id INT NOT NULL,
    equipe_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cronograma_id) REFERENCES cronograma_instalacao(id) ON DELETE CASCADE,
    FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cronograma_equipe (cronograma_id, equipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relação cronograma-material
CREATE TABLE IF NOT EXISTS cronograma_material (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cronograma_id INT NOT NULL,
    material_id INT NOT NULL,
    quantidade_necessaria INT NOT NULL DEFAULT 1,
    quantidade_confirmada INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cronograma_id) REFERENCES cronograma_instalacao(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cronograma_material (cronograma_id, material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relação cronograma-carro
CREATE TABLE IF NOT EXISTS cronograma_carro (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cronograma_id INT NOT NULL,
    carro_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cronograma_id) REFERENCES cronograma_instalacao(id) ON DELETE CASCADE,
    FOREIGN KEY (carro_id) REFERENCES carros(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cronograma_carro (cronograma_id, carro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados iniciais
INSERT INTO tipos_instalacao (nome, descricao) VALUES
('Instalação Residencial', 'Instalações em residências'),
('Instalação Comercial', 'Instalações em estabelecimentos comerciais'),
('Instalação Industrial', 'Instalações em ambientes industriais');

-- Inserir unidades de medida padrão
INSERT INTO unidades_medida (nome, simbolo, tipo) VALUES
('Unidade', 'un', 'unidade'),
('Metro quadrado', 'm²', 'area'),
('Centímetro quadrado', 'cm²', 'area'),
('Quilograma', 'kg', 'peso'),
('Grama', 'g', 'peso'),
('Litro', 'L', 'volume'),
('Mililitro', 'mL', 'volume'),
('Metro', 'm', 'comprimento'),
('Centímetro', 'cm', 'comprimento'),
('Rolo', 'rolo', 'unidade'),
('Caixa', 'cx', 'unidade'),
('Pacote', 'pct', 'unidade');

-- Inserir categorias padrão
INSERT INTO categorias_material (nome, descricao) VALUES
('Impressão', 'Materiais para impressão (papel, tinta, banners)'),
('Instalação', 'Materiais para instalação (parafusos, fita, estruturas)'),
('Comunicação Visual', 'Materiais de comunicação visual'),
('Adesivos', 'Adesivos e vinis'),
('Estruturas', 'Estruturas metálicas e suportes');
