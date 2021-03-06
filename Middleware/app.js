/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , farmer = require('./routes/farmer')
  , product = require('./routes/product')
  , login = require('./routes/login')
  , cart = require('./routes/cart')
  , order = require('./routes/order')
  , truck = require('./routes/truck')
  , driver =  require('./routes/driver')
  ,farmerLogin = require('./routes/farmerLogin')
  //ADMIN
  , admin = require('./routes/admin')
  //STORE
  , store = require('./routes/store');

//JUST FOR PASSPORT LOGIN
var passport = require('passport');
require('./routes/passport')(passport);


var mongoose = require('mongoose');
mongoose.connect("mongodb://admin:adminadmin@ds013172.mlab.com:13172/reshelf");
//mongoose.connect("mongodb://localhost:27017/reshelf");

var mongoURL = "mongodb://admin:adminadmin@ds013172.mlab.com:13172/reshelf";
//var mongoURL = "mongodb://localhost:27017/reshelf";
var expressSession = require("express-session");
var mongoStore = require("connect-mongo")(expressSession);

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/public/img', limit: '3mb'}));
app.use(express.methodOverride());
//app.use('/uploads', express.static(path.join(__dirname,'uploads')));
//app.use(multer({dest: './uploads/'}))

//EXPRESS SESSION CONFIG
app.use(expressSession({
	key: 'amazon_cookie',
    secret: 'amazon',
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new mongoStore({
		url: mongoURL
	})
}));
app.use(passport.initialize());
// app.use(passport.session());


app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


//GET REQUEST


//app.get('/', routes.index);
app.get('/users', user.list);
app.get('/PreviewOrder', isAuthenticated, order.home);

//STORE API
app.get('/store/home',store.home);
app.get('/store/login',store.login);
app.get('/store/logout', store.logout);
app.post('/store/checkLogin', store.checkLogin);
app.get('/store/orders/list', store.ordersList);
app.post('/store/orders/all', order.allStoreOrders);
app.get('/store/profile', store.profile)
app.post('/store/getStoreProfile', store.getStoreProfile);
app.post('/store/saveStoreProfile', store.saveStoreProfile);
//app.post('/store/orderDetails', order.orderStoreDetails);
//Home page map get stores
app.post('/store/getStores', store.getStores);

//ADMIN API
app.get('/admin/home',admin.home);
app.get('/admin/login',admin.login);
app.get('/admin/logout', admin.logout);
app.post('/admin/checkLogin', admin.checkLogin);
app.get('/admin/profile', admin.profile);//get admin profile page
app.post('/admin/getAdminProfile', admin.getAdminProfile);//get admin profile details
app.post('/admin/saveProfile', admin.saveAdminProfile);//save admin profile
app.get('/admin/farmers/list',admin.farmersList);
app.get('/admin/products/list',admin.productsList);
app.get('/admin/trucks/list',admin.trucksList);
app.get('/admin/drivers/list',admin.driversList);
app.get('/admin/customers/list',admin.customersList);
app.get('/admin/orders/list',admin.ordersList);
//app.post('/admin/addFarmer', admin.addFarmer);;

//TRUCK API
app.post('/truck/create', truck.createTruck);
app.get('/truck/all', truck.getTrucks);
app.post('/truck/edit', truck.editTruck);
app.delete('/truck/delete',truck.deleteTruck);

//DRIVER API
app.post('/driver/create', driver.createDriver);
app.get('/driver/all', driver.getDrivers);
app.post('/driver/edit', driver.editDriver);
app.delete('/driver/delete',driver.deleteDriver);

//CUSTOMER API
app.post('/customer/create', user.createCustomer);
app.get('/customer/all', user.getCustomers);
app.post('/customer/edit', user.editCustomer);
app.delete('/customer/delete',user.deleteCustomer);
app.get('/farmer/products/list', function(req,res){ 
  if(req.session.farmer) {
    res.render('./farmer/productlist', {
      email : req.session.farmer.email, 
      fname : req.session.farmer.fname, 
      lname : req.session.farmer.lname, 
      createdAt : req.session.farmer.createdAt
    });
  }
  else{
    res.redirect('/farmer/login');
  }
});
app.get('/farmer/product/all',farmerLogin.productlist);


//ORDER API
app.post('/order/pending', order.getPending);
app.post('/order/inprogress', order.getInProgress);
app.post('/order/complete', order.getComplete);
app.post('/order/cancel', order.getCancel);
app.post('/order/assignDriverId', order.assignDriverId);
app.post('/order/assignComplete', order.assignComplete);
app.post('/order/getRevenue', order.getRevenue);//getting revenue fror chart

app.post('/farmer/login', function(req, res, next) {
  passport.authenticate('farmerLogin', function(err, farmer, info) {
    if(err) {
      console.log(err);
      return next(err);
    }
    
    if(!farmer) {
      req.session.wrongSignIn = true;
      console.log("login failed");
      return res.redirect('/farmer/login');
    }
    else{
      req.logIn(farmer, {session: false}, function(err) {
        if(err) {
          return next(err);
        }
        console.log("login success");
        req.session.farmer = farmer;
        res.send({"status": 200, "data": true});
      })
    }
  })(req, res, next);
});

app.post('/farmer/signup',farmerLogin.signup);
app.get('/farmer/signup',farmerLogin.userSignUp);
app.get('/farmer/login',farmerLogin.userSignIn);
app.get('/farmer/checkEmail',farmerLogin.checkEmail);
app.get('/farmer/home',farmerLogin.home);
app.get('/farmer/product/all', function(req,res){ res.render('/farmer/productlist'); });
app.get('/farmer/order/pending', function(req,res){ res.render('/farmer/pendinglist'); });
app.get('/farmer/order/complete', function(req,res){ res.render('/farmer/completelist'); });
app.get('/farmer/all',farmer.getFarmers);
app.post('/farmer/create',farmer.createFarmer);
app.delete('/farmer/delete',farmer.deleteFarmer);
app.post('/farmer/edit',farmer.editFarmer);
app.get('/farmer/get', function(req,res){ console.log(req.session.farmer); res.send({"status":200,"data":req.session.farmer}); })
app.post('/farmer/product/create',farmerLogin.createProduct);
app.post('/farmer/product/delete',farmerLogin.deleteProduct);
app.post('/farmer/product/edit',farmerLogin.editProduct);

app.post('/user/address/update',user.editAddress);
app.post('/user/card/update',user.editCard);
app.get('/user/address',user.getAddress);
app.get('/user/orders',order.orderDetails);
 //app.get('/user/orders',user.getOrders);

//PRODUCT API
app.get('/product/store', product.getStoreProducts);

app.get('/product/all',product.getProducts);
app.post('/product/create',product.createProduct);

app.post('/fileUpload', product.fileUpload);//file uploading

app.delete('/product/delete',product.deleteProduct);
app.post('/product/edit',product.editProduct);


app.get('/category/get', product.getCategory);


//app.get('/prod_details', user.prod_details);
app.get('/myReviews', product.myReviews);
app.get('/search', product.prod_search);
app.get('/product', product.prod_details);
app.post('/create_review',product.create_review);
app.post('/f_create_review',product.f_create_review); 
app.get('/store_page',product.farmer_page);

app.get('/frame', function(req,res){
  res.render('frame');
})
app.get('/login', login.signIn);
app.get('/signup', login.signUp);
app.get('/logout', function(req,res) {
  req.session.destroy(function(err){
    res.redirect('/');
  })
});



app.get('/myOrders', function(req, res){

  if(typeof req.session.user != 'undefined'){
    console.log(req.session.user);
    res.render('myOrders', { user: req.session.user });
  }else{
    res.render('index');
  }
});


app.get('/waste-stats', function(req, res){

  if(typeof req.session.user != 'undefined'){
    console.log(req.session.user);
    res.render('chart', { user: req.session.user });
  }else{
    res.render('chart');
  }
});

// app.get('/orderDetails', function(req, res){

//   if(typeof req.session.user != 'undefined'){
//     console.log(req.session.user);
//     res.render('orderDetails', { user: req.session.user });
//   }else{
//     res.render('index');
//   }
// });


app.get('/customerAccount', function(req, res){

  if(typeof req.session.user != 'undefined'){
    console.log(req.session.user);
    res.render('customerAccount', { user: req.session.user });
  }else{
    res.render('index');
  }
});

app.get('/help', function(req, res){

  if(typeof req.session.user != 'undefined'){
    console.log(req.session.user);
    res.render('help', { user: req.session.user });
  }else{
    res.render('index');
  }
});

app.get('/addressDetails', function(req, res){
  if(typeof req.session.user !== 'undefined'){
    console.log(req.session.user);
    res.render('addressDetails', { user: req.session.user });
  }else{
    res.render('index');
  }
  });


app.get('/', function(req, res){
  if(typeof req.session.user !== 'undefined'){
    console.log(req.session.user);
    res.render('map', { user: req.session.user });
  }else{
    res.render('map');
  }
  });

app.get('/conditions', function(req, res){
  if(typeof req.session.user !== 'undefined'){
    console.log(req.session.user);
    res.render('conditions', { user: req.session.user });
  }else{
    res.render('conditions');
  }
  });


app.get('/', function(req, res){
  if(typeof req.session.user !== 'undefined'){
    console.log(req.session.user);
    res.render('map', { user: req.session.user });
  }else{
    res.render('map');
  }
  });

app.get('/carrers', function(req, res){
  if(typeof req.session.user !== 'undefined'){
    console.log(req.session.user);
    res.render('carrers', { user: req.session.user });
  }else{
    res.render('carrers');
  }
  });

app.get('/privacy', function(req, res){
  if(typeof req.session.user !== 'undefined'){
    console.log(req.session.user);
    res.render('privacy', { user: req.session.user });
  }else{
    res.render('privacy');
  }
  });

app.get('/paymentOptions', function(req, res){
  if(typeof req.session.user !== 'undefined'){
    console.log(req.session.user);
    res.render('creditCardDetails', { user: req.session.user });
  }else{
    res.render('index');
  }
  });







function isAuthenticated(req, res, next) {
  if(req.session.user) {
     return next();
  }
  res.redirect('/login');
};

// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function(id, done) {
//     done(null, id);
// });



//POST REQUEST
app.post('/login', function(req, res, next) {
  passport.authenticate('login', function(err, user, info) {
    if(err) {
      return next(err);
    }

    if(!user) {
      req.session.wrongSignIn = true;
      res.redirect('/login');
    }
    else{
      req.logIn(user, {session: false}, function(err) {
        if(err) {
          return next(err);
        }
        req.session.user = user;
        return res.redirect('/');
      })
    }
  })(req, res, next);
});


app.post('/reg', login.regUser);
app.post('/additem', cart.addItem);
app.post('/cart', cart.cartItems);
app.post('/suggest', product.suggest);
app.post('/order', order.createOrder);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
