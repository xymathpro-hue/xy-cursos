# 🚀 GUIA COMPLETO: COLOCAR XY CURSOS NO AR

## VISÃO GERAL

Este guia vai te levar do zero até o site funcionando online.

**Tempo estimado:** 30-45 minutos
**Custo:** R$ 0 (tudo gratuito)

**O que vamos fazer:**
1. Criar conta no GitHub
2. Subir o código para o GitHub
3. Criar banco de dados no Supabase
4. Fazer deploy na Vercel
5. Testar tudo funcionando

---

## PARTE 1: PREPARAÇÃO LOCAL

### Passo 1.1 - Extrair o projeto

1. Baixe o arquivo `xy-cursos.zip`
2. Extraia em uma pasta fácil de encontrar, por exemplo:
   - Windows: `C:\Projetos\xy-cursos`
   - Mac: `/Users/SeuNome/Projetos/xy-cursos`

### Passo 1.2 - Instalar Node.js (se não tiver)

1. Acesse: https://nodejs.org
2. Baixe a versão **LTS** (recomendada)
3. Instale seguindo o assistente (Next, Next, Next...)
4. Para verificar, abra o terminal e digite:
   ```
   node --version
   ```
   Deve aparecer algo como `v20.x.x`

### Passo 1.3 - Instalar Git (se não tiver)

1. Acesse: https://git-scm.com/downloads
2. Baixe para seu sistema
3. Instale seguindo o assistente
4. Para verificar, abra o terminal e digite:
   ```
   git --version
   ```
   Deve aparecer algo como `git version 2.x.x`

---

## PARTE 2: CRIAR CONTA NO GITHUB

### Passo 2.1 - Criar conta

1. Acesse: https://github.com
2. Clique em **"Sign up"** (canto superior direito)
3. Preencha:
   - Email: seu email
   - Senha: crie uma senha forte
   - Username: escolha um nome (ex: `marceloxycursos`)
4. Complete a verificação
5. Confirme seu email (verifique a caixa de entrada)

### Passo 2.2 - Criar repositório

1. Logado no GitHub, clique no **"+"** no canto superior direito
2. Clique em **"New repository"**
3. Preencha:
   - Repository name: `xy-cursos`
   - Description: `Plataforma Integrada de Estudos`
   - Marque: **Public** (para funcionar grátis na Vercel)
   - **NÃO marque** "Add a README file"
   - **NÃO marque** "Add .gitignore"
4. Clique em **"Create repository"**
5. **IMPORTANTE:** Deixe essa página aberta, vamos usar em breve

---

## PARTE 3: SUBIR CÓDIGO PARA O GITHUB

### Passo 3.1 - Abrir terminal na pasta do projeto

**Windows:**
1. Abra o Explorador de Arquivos
2. Navegue até a pasta `xy-cursos`
3. Clique na barra de endereços
4. Digite `cmd` e pressione Enter

**Mac:**
1. Abra o Finder
2. Navegue até a pasta `xy-cursos`
3. Clique com botão direito na pasta
4. Selecione "Novo Terminal na Pasta"

### Passo 3.2 - Configurar Git (primeira vez apenas)

No terminal, digite esses comandos (substitua com seus dados):

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### Passo 3.3 - Inicializar e subir o código

Digite esses comandos um por um:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Primeiro commit - XY Cursos"
```

```bash
git branch -M main
```

**IMPORTANTE:** No comando abaixo, substitua `SEU_USUARIO` pelo seu username do GitHub:

```bash
git remote add origin https://github.com/SEU_USUARIO/xy-cursos.git
```

```bash
git push -u origin main
```

### Passo 3.4 - Autenticar no GitHub

Quando executar o `git push`, vai aparecer uma janela pedindo login:
1. Clique em **"Sign in with your browser"**
2. Autorize o acesso
3. Volte ao terminal - deve continuar automaticamente

### Passo 3.5 - Verificar

1. Volte à página do GitHub (que deixamos aberta)
2. Atualize a página (F5)
3. Deve aparecer todos os arquivos do projeto

✅ **Checkpoint:** Código está no GitHub!

---

## PARTE 4: CRIAR BANCO DE DADOS NO SUPABASE

### Passo 4.1 - Criar conta no Supabase

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Clique em **"Sign in with GitHub"**
4. Autorize o acesso
5. Você será logado automaticamente

### Passo 4.2 - Criar novo projeto

1. Clique em **"New Project"**
2. Selecione sua organização (provavelmente já aparece uma)
3. Preencha:
   - **Name:** `xy-cursos`
   - **Database Password:** Crie uma senha FORTE e **ANOTE EM ALGUM LUGAR**
   - **Region:** `South America (São Paulo)` - mais perto = mais rápido
4. Clique em **"Create new project"**
5. **AGUARDE** - pode levar 2-3 minutos para criar

### Passo 4.3 - Copiar as chaves

Quando o projeto estiver pronto:

1. No menu lateral esquerdo, clique em **"Project Settings"** (ícone de engrenagem)
2. Clique em **"API"** (no submenu)
3. Você vai ver duas informações importantes:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
👆 COPIE E GUARDE ISSO

**anon public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
👆 COPIE E GUARDE ISSO TAMBÉM

### Passo 4.4 - Criar as tabelas do banco

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**
3. Abra o arquivo `supabase/schema.sql` do projeto (no seu computador)
4. Copie **TODO** o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique no botão **"Run"** (ou Ctrl+Enter)
7. Deve aparecer **"Success. No rows returned"**

### Passo 4.5 - Verificar tabelas

1. No menu lateral, clique em **"Table Editor"**
2. Deve aparecer as tabelas:
   - profiles
   - modulos
   - fases
   - questoes
   - progresso
   - badges
   - (e outras)

✅ **Checkpoint:** Banco de dados criado!

---

## PARTE 5: DEPLOY NA VERCEL

### Passo 5.1 - Criar conta na Vercel

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"**
3. Clique em **"Continue with GitHub"**
4. Autorize o acesso
5. Você será logado automaticamente

### Passo 5.2 - Importar projeto

1. Na dashboard da Vercel, clique em **"Add New..."**
2. Clique em **"Project"**
3. Na lista de repositórios, encontre `xy-cursos`
4. Clique em **"Import"**

### Passo 5.3 - Configurar variáveis de ambiente

Antes de fazer o deploy, você precisa adicionar as chaves do Supabase:

1. Na tela de configuração, expanda **"Environment Variables"**
2. Adicione a primeira variável:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** Cole a URL do Supabase (https://xxxxx.supabase.co)
   - Clique em **"Add"**
3. Adicione a segunda variável:
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** Cole a chave anon do Supabase (eyJhbG...)
   - Clique em **"Add"**

### Passo 5.4 - Deploy

1. Verifique se as duas variáveis estão listadas
2. Clique em **"Deploy"**
3. **AGUARDE** - o deploy leva 2-4 minutos
4. Você vai ver o progresso em tempo real

### Passo 5.5 - Acessar o site

Quando terminar:
1. Vai aparecer uma tela de "Congratulations!"
2. Clique no preview do site ou no link que aparece
3. Seu site está no ar! 🎉

O endereço será algo como:
```
https://xy-cursos.vercel.app
```

✅ **Checkpoint:** Site no ar!

---

## PARTE 6: CONFIGURAR AUTENTICAÇÃO

### Passo 6.1 - Configurar URLs no Supabase

1. Volte ao Supabase
2. Vá em **"Authentication"** (menu lateral)
3. Clique em **"URL Configuration"**
4. Em **"Site URL"**, coloque a URL da Vercel:
   ```
   https://xy-cursos.vercel.app
   ```
5. Em **"Redirect URLs"**, adicione:
   ```
   https://xy-cursos.vercel.app/**
   ```
6. Clique em **"Save"**

### Passo 6.2 - Testar cadastro

1. Acesse seu site na Vercel
2. Clique em **"Criar Conta Grátis"**
3. Preencha nome, email e senha
4. Clique em cadastrar
5. Verifique se funciona!

---

## PARTE 7: DOMÍNIO PERSONALIZADO (OPCIONAL)

Se você já tem um domínio (ex: xycursos.com.br):

### Passo 7.1 - Adicionar domínio na Vercel

1. Na dashboard da Vercel, clique no projeto `xy-cursos`
2. Clique em **"Settings"**
3. Clique em **"Domains"**
4. Digite seu domínio: `xycursos.com.br`
5. Clique em **"Add"**

### Passo 7.2 - Configurar DNS

A Vercel vai mostrar instruções. Geralmente:

1. Acesse o painel do seu registrador (Registro.br, GoDaddy, etc)
2. Vá nas configurações de DNS
3. Adicione os registros que a Vercel indicar:
   - Tipo: `A` ou `CNAME`
   - Nome: `@` ou `www`
   - Valor: IP ou endereço que a Vercel fornecer

### Passo 7.3 - Aguardar propagação

- Pode levar até 48 horas para o DNS propagar
- Geralmente funciona em 15-30 minutos

---

## 🎉 PRONTO!

Seu XY Cursos está no ar com:
- ✅ Site funcionando
- ✅ Banco de dados configurado
- ✅ Autenticação de usuários
- ✅ 4 plataformas (ENEM, Olímpico, Financeiro, IFPI)

---

## ❓ PROBLEMAS COMUNS

### Erro no deploy da Vercel
- Verifique se as variáveis de ambiente estão corretas
- Confira se não há erros de digitação nas chaves

### Erro ao criar tabelas
- Execute o SQL em partes menores
- Verifique se está usando o SQL Editor correto

### Login não funciona
- Confirme que a URL está configurada no Supabase
- Verifique os Redirect URLs

### Site não carrega
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Tente em uma aba anônima

---

## 📞 PRÓXIMOS PASSOS

1. **Adicionar questões** ao banco de dados
2. **Personalizar** cores e textos
3. **Configurar** email de confirmação
4. **Divulgar** para os alunos!

---

**Desenvolvido para XY Cursos** 🚀
