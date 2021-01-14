
//Iniciando módulos
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const admin = require('./routes/admin')
const path = require('path')
const mongoose = require('mongoose');
const Console = require('console')
const session = require('express-session')
const flash = require('connect-flash')
require("./models/Postagem")
const Postagem = mongoose.model("postagens")
require("./models/Categoria")
const Categoria = mongoose.model("categorias")
const usuarios = require('./routes/usuario')

//Configurações

//Sessão
app.use(session({
    secret: "secretsegura",
    resave: true,
    saveUninitialized: true
}))

//Flash
app.use(flash());

//Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    next();
})

//body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
// Handlebars 
app.engine('handlebars', handlebars({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')
//Mongoose
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/blogapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false

}).then(() => {
    Console.log("Conectado ao Mongo")
}).catch((err) => {
    console.log("Erro ao se conectar" + err)
})


//Public
app.use(express.static(path.join(__dirname, "public")))

app.use((req, res, next) => {
    next()
})

//Rotas
app.get('/', (req, res) => {
    Postagem.find().populate("categoria").sort({ data: "desc" }).lean().then((postagens) => {
        res.render('index', { postagens: postagens })
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno')
        res.redirect('/404')
    })

    app.get("/postagem/:slug", (req, res) => {
        Postagem.findOne({ slug: req.params.slug }).lean().then((postagem) => {
            if (postagem) {
                res.render("postagem/index", { postagem: postagem })
            } else {
                req.flash('error_msg', 'Esta postagem não existe')
                res.redirect('/')
            }
        }).catch((err) => {
            req.flash('error_msg', 'houve um erro interno')
            res.redirect('/')
        })
    })
    app.get('/categorias', (req, res) => {
        Categoria.find().lean().then((categorias) => {
            res.render('categorias/index', { categorias: categorias })
        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro interno ao listar as categorias')
            res.redirect('/')
        })
    })
    app.get('/categorias/:slug', (req, res) => {
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if (categoria) {

                Postagem.find({ categoria: categoria._id }).lean().then((postagens) => {
                    res.render('categorias/postagens', {postagens: postagens, categoria: categoria})
                }).catch((err)=>{
                    req.flash('erro_msg', 'Houve um erro ao listar os posts!')
                    res.redirect('/')
                })
            } else {
                req.flash('error_msg', 'Esta categoria não existe!')
                res.redirect('/')
            }

        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro interno ao carregar a página da categoria')
            res.redirect('/')
        })
    })

    app.get('/404', (req, res) => {
        res.send("error 404!")
    })

})
app.use('/admin', admin)
app.use('/usuarios', usuarios)

//Outros
const PORT = 8081;
app.listen(PORT, () => {
    console.log("Servidor Rodando!")
})