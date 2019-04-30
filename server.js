// =================================================================
// get the packages we need ========================================
// =================================================================
var express 	= require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
var Balanced = require('./app/models/balanced'); // get our mongoose model

// =================================================================
// configuration ===================================================
// =================================================================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =================================================================
// routes ==========================================================
// =================================================================
app.post('/setup', function(req, res) {

	// create a sample user
	var nick = new User({ 
		name: req.body.name, 
		password: req.body.password,
		admin: false 
	});
	
	nick.save(function(err) {
		if (err) throw err;

		console.log('User saved successfully');
		res.json({ success: true });
	});
});

// basic route (http://localhost:8080)
app.get('/', function(req, res) {
	res.sendFile(__dirname+'/index.html');
});

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var route = express.Router(); 

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/api/authenticate
route.post('/authenticate', function(req, res) {

	// find the user
	User.findOne({
		name: req.body.name
	}, function(err, user) {

		if (err) throw err;

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {

			// check if password matches
			if (user.password != req.body.password) {
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {

				// if user is found and password is right
				// create a token
				var payload = {
					name: req.body.name,
					admin: user.admin	
				}
				var token = jwt.sign(payload, app.get('superSecret'), {
					expiresIn: 86400 // expires in 24 hours
				});

				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				});
			}		

		}

	});
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
route.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;
				console.log("decoded token", req.decoded);	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.'
		});
		
	}
	
});

// ---------------------------------------------------------
// authenticated routes
// ---------------------------------------------------------
route.get('/', function(req, res) {
	res.json({ message: 'Welcome to the coolest API on earth!' });
});

route.get('/users', function(req, res) {
	if(req.decoded.admin){
		User.find({}, function(err, users) {
			res.json(users);
		});
	} else {
		res.json({"message": "You are not an admin."});
	}
});

route.get('/delete', function(req, res) {
	if(req.decoded.admin){
		User.deleteMany({"name": req.body.name}, function(err) {
			if(err) res.json({"message": "Please check the username."});
			else res.json({"message": "success"});
		});
	} else {
		res.json({"message": "You are not an admin."});
	}
});

route.get('/balanced', function(req, res) {
	if(checkBalanced(req.body.input)){
		console.log('username in token', req.decoded.name);
		Balanced.find({"name": req.decoded.name}, function(err, docs){
			console.log(docs);
			if(docs.length > 0){
				docs[0].attempts = docs[0].attempts + 1
				docs[0].message = 'success';
				docs[0].save();
			} else {
				// create a sample user
				var balanced = new Balanced({ 
					name: req.decoded.name, 
					attempts: 1, 
					message: ""
				});
				
				balanced.save(function(err) {
					if (err) throw err;
					console.log('Balanced updated successfully');
				});
			}
		});
		res.json({ message: "Balanced" });
	} else {
		res.json({ message: "Unbalanced" });
	}
});

route.get('/check', function(req, res) {
	res.json(req.decoded);
});

app.use('/api', route);

function checkBalanced(input){
	console.log('paranthesis input', input);
	let stack = [];
    let map = {
        '(': ')',
        '[': ']',
        '{': '}'
    }
    for (let i = 0; i < input.length; i++) {

        // If character is an opening brace add it to a stack
        if (input[i] === '(' || input[i] === '{' || input[i] === '[' ) {
            stack.push(input[i]);
        }
        //  If that character is a closing brace, pop from the stack, which will also reduce the length of the stack each time a closing bracket is encountered.
        else {
            let last = stack.pop();

            //If the popped element from the stack, which is the last opening brace doesn’t match the corresponding closing brace in the map, then return false
            if (input[i] !== map[last]) {return false};
        }
    }
    // By the completion of the for loop after checking all the brackets of the str, at the end, if the stack is not empty then fail
        if (stack.length !== 0) {return false};

    return true;
}

// =================================================================
// start the server ================================================
// =================================================================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
