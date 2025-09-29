var DATABASE_NAME = 'src';
var DB_USERNAME = 'verp';
var DB_PASSWORD = 'verp';

var Sequelize = require('../../core/service/sequelize');
var FS = require('fs');

var sequelize = new Sequelize(
	DATABASE_NAME, 
	DB_USERNAME, 
	DB_PASSWORD, {
		host: 'localhost',
		port: 5432,
		dialect: 'postgres',
		define: {
			freezeTableName: true
		}
});

//Connect to Database
sequelize.authenticate().then(function (e) {
	if(e) {
		console.log('There is connection ERROR');
	} else {
		console.log('Connection has been established successfully');
	}
});

//Create Table: image

var ImageStore = sequelize.define('image', {
	imageId: {
		type: Sequelize.INTEGER
	},
	imageType: {
		type: Sequelize.STRING,
		allowNull: false
	},
	image: {
		type: Sequelize.BLOB('long')
	},
	imageSize: {
		type: Sequelize.INTEGER
	},
	imageName: {
		type: Sequelize.STRING
	}
});

sequelize.sync({
	force: true,
	logging: console.log

}).then(function () {
	console.log('Everything is synced');
	
	//Give any image name here.
	var imageData = FS.readFileSync(__dirname + '/lang_ar.png');

	ImageStore.create({
		imageId: 123,
		imageType: 'png',
		image: imageData,
		imageSize: 3,
		imageName: 'FileName'
	}).then(function (imageStore) {
		try {
			//console.log(image_store.image)
			FS.writeFileSync(__dirname + '/lang_ar_target.png', imageStore.image);
		} catch (e) {
			console.log(e+'');
		}
	});
});