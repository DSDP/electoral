import Ember from 'ember';


export default Ember.Controller.extend({
	provinces: ["CAPITAL FEDERAL","BUENOS AIRES","CATAMARCA","CORDOBA","CORRIENTES","CHACO","CHUBUT","ENTRE RIOS","FORMOSA","JUJUY","LA PAMPA","LA RIOJA","MENDOZA","MISIONES","NEUQUEN","RIO NEGRO","SALTA","SAN JUAN","SAN LUIS","SANTA CRUZ","SANTA FE","SANTIAGO DEL ESTERO","TUCUMAN","TIERRA DEL FUEGO"],
	sexos: ['M', 'F'],
	aval: null,
	isShowList: true,
	needs: ['application'],
	foundPeople: false,
	page: 1,
	perPage: 6,


	findInscriptor: function () {
		var _this = this;

		this.get('controllers.application.db').transaction(function (tx) { 
		  tx.executeSql('SELECT * FROM afiliado_pj where matricula= ?', [_this.get('aval').get('documento')], function (tx, results) {
		  	console.log(results);
		  	if (results.rows.length == 1) {
		  		tx.executeSql('SELECT * FROM afiliado where matricula= ?', [_this.get('aval').get('documento')], function (tx, results) {
			  		var item = results.rows.item(0);
					_this.get('aval').set('nombre', item.nombres);
					_this.get('aval').set('apellido', item.apellido);
					_this.get('aval').set('domicilio', item.domicilio);
					_this.get('aval').set('sexo', item.sexo);
					_this.get('aval').set('provincia', _this.get('provinces').objectAt(item.distrito - 1));
					_this.set('foundPeople', true);
					
		  		});

		  	} else {
				_this.set('foundPeople', false);
		  	}
		  });			
		});

		/*
		var doc = this.get('controllers.application.model').findProperty('document', this.get('aval').get('documento'));
		if (doc) {
			this.get('aval').set('nombre', doc.get('apellido y nombre'));
			this.get('aval').set('domicilio', doc.get('domicilio'));
			this.get('aval').set('sexo', doc.get('s') === "1" ? 'F' : 'M');
			this.set('foundPeople', true);
		} else {
			this.set('foundPeople', false);
		}
		*/
	}.observes('aval', 'aval.documento'),

	actions: {

		nextPage: function () {
			this.set('page', this.get('page') + 1);
		},

		prevPage: function () {
			this.set('page', this.get('page') - 1);
		},	

		exportList: function () {
			
			var csvContent = "APELLIDO,NOMBRE,DOCUMENTO,SEXO,DOMICILIO,LOCALIDAD,PROVINCIA\n";
			var i = 0;
			this.get('store').findAll('aval').then(function(record){
			     record.content.forEach(function(rec) {
				   var dataString = rec.get('nombre') + "," + rec.get('apellido') + "," + rec.get('documento') + "," + rec.get('sexo') + "," + rec.get('domicilio') + "," + rec.get('localidad') + "," + rec.get('provincia');
				   csvContent += dataString + "\n";
				   i++;
			     }, this);
				var encodedUri = encodeURI(csvContent);

				var content = new Buffer(csvContent, 'utf-8');

				var fdialogs = require('node-webkit-fdialogs');

				var Dialog = new fdialogs.FDialog({
				    type: 'save',
				    accept: ['.csv'],
				    defaultSavePath: 'avales.csv'
				});	

				Dialog.saveFile(content, function (err, path) {
				 
				    console.log("File saved in", path);
				 
				});


				/*var gui = require('nw.gui');
				var clipboard = gui.Clipboard.get();
				clipboard.set(csvContent, 'text');
				*/
		 	});		
		},

		clearList: function () {
			this.get('store').findAll('aval').then(function(record){
			     record.content.forEach(function(rec) {
			        Ember.run.once(this, function() {
			           rec.deleteRecord();
			           rec.save();
			        });
			     }, this);
		 	 });
		},

		showList: function () {
			this.get('aval').rollback();
			this.set('isShowList', true);
		},

		new: function () {
			this.set('isShowList', false);
			this.set('aval', this.get('store').createRecord('aval'));
		},

		save: function () {
			var _this = this;
			this.get('aval').save().then(function (aval) {
				_this.set('aval', _this.get('store').createRecord('aval'));
			});
		},
	},


	avalList: Ember.computed('page', 'model.@each', 'perPage', function () {
		if (this.get('model')) {
			var d = this.get('perPage') * (this.get('page') - 1);
			var h = this.get('perPage') * this.get('page');
			return this.get('model').slice(d, h);
		} else {
			return null;
		}
	}),

	errorsPages: Ember.computed('model', 'perPage', function () {
		if (this.get('model')) {
			return Math.ceil(this.get('model').get('length') / this.get('perPage'));
		} else {
			return 0;
		}
	}),	

	hasNextPage: Ember.computed('errorsPages', 'page', function () {
		return this.get('page') < this.get('errorsPages');
	}),

	hasPrevPage: Ember.computed('errorsPages', 'page', function () {
		return this.get('page') > 1;
	}),	
});
