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
		  	if (results.rows.length == 1) {
		  		tx.executeSql('SELECT * FROM afiliado where matricula= ?', [_this.get('aval').get('documento')], function (tx, results) {
			  		var item = results.rows.item(0);
					_this.get('aval').set('nombre', item.nombres);
					_this.get('aval').set('apellido', item.apellido);
					_this.get('aval').set('domicilio', item.domicilio);
					_this.get('aval').set('sexo', item.sexo);
					_this.get('aval').set('provincia', _this.get('provinces').objectAt(item.distrito - 1));
					tx.executeSql('SELECT * FROM secciones where id = ' + item.secc + ' and prov = ' + item.distrito, [], function (tx, result) { 
						 var seccion = result.rows.item(0);
						_this.get('aval').set('localidad', seccion.nombre);				
					});
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
			this.set('page', parseInt(this.get('page')) + 1);
		},

		prevPage: function () {
			this.set('page', parseInt(this.get('page')) - 1);
		},	

		exportList: function () {
			
			var csvContent = "APELLIDO;NOMBRE;DOCUMENTO;SEXO;DOMICILIO;LOCALIDAD;PROVINCIA\n";
			var i = 0;
			this.get('store').findAll('aval').then(function(record){
			     record.content.forEach(function(rec) {
				   var dataString = rec.get('nombre') + ";" + rec.get('apellido') + ";" + rec.get('documento') + ";" + rec.get('sexo') + ";" + rec.get('domicilio') + ";" + rec.get('localidad') + ";" + rec.get('provincia');
				   csvContent += dataString + "\n";
				   i++;
			     }, this);
				var encodedUri = encodeURI(csvContent);

				var content = new Buffer(csvContent, 'utf-8');

			    var chooser = $('#export')[0];
			    chooser.addEventListener("change", function(evt) {
				    var fs = require('fs');// save it now
					fs.writeFile(this.value, content, function(err) {
					    if(err) {
					       alert("error"+err);
					    }
					});
			    }, false);

			    chooser.click();  

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
			this.set('isNew', false);
			this.set('isShowList', true);
			this.set('isCreating', false);
			if (this.get('aval')) {
				this.get('aval').rollback();
			}

		},

		new: function () {
			this.set('isShowList', false);
			this.set('isCreating', false);
			this.set('isNew', true);
			this.set('aval', this.get('store').createRecord('aval'));
			this.set('newRecord', true);
		},

		save: function () {
			var _this = this;
			this.get('aval').save().then(function (aval) {
				_this.set('aval', _this.get('store').createRecord('aval'));
			});
		},

		create: function () {
			this.set('isShowList', false);
			this.set('isCreating', true);
			this.set('isNew', false);
			if (this.get('aval')) {
				this.get('aval').rollback();
			}
		},

		process: function  () {
			var _this = this;
			var fr = new FileReader();
			var fileInputElement = document.getElementById("file");
			fr.readAsText(fileInputElement.files[0]);
			this.set('processing', true);

			fr.onload = function () {
			    var allTextLines = fr.result.split(/\r\n|\n/);
			    var headers = allTextLines[0].split(';');
			    if (headers.length < 2) {
			    	headers = allTextLines[0].split(',');
			    }
			    var lines = [];

			    for (var i=1; i<allTextLines.length; i++) {	    	
			        var data = allTextLines[i].split(';');
			        if (data.length < 2)
			        	data = allTextLines[i].split(',');

			        if (data.length == headers.length) {
			            var tarr = Ember.Object.create({
			            	lineNumber: i
			            });
			            for (var j=0; j<headers.length; j++) {
			                tarr.set(headers[j].toLowerCase(), data[j]);
			            }
			            lines.push(tarr);
			        }
			    }
			    _this.proccesLines(lines);
			};
		}	
	},

	proccesLines: function  (lines ) {
		var _this = this;
		_this.get('controllers.application.db').transaction(function (tx) { 
			lines.forEach(function (line, index) {
				var matricula = line.get('documento');
		  		tx.executeSql('SELECT * FROM afiliado where matricula= ?', [line.get('documento')], function (tx, resultss) {
		  			if (resultss.rows.length > 0) {
				  		var item = resultss.rows.item(0);
						line.set('nombre', item.nombres);
						line.set('apellido', item.apellido);
						line.set('domicilio', item.domicilio);
						line.set('sexo', item.sexo);
						line.set('provincia', _this.get('provinces').objectAt(item.distrito - 1));
						tx.executeSql('SELECT * FROM secciones where id = ' + item.secc + ' and prov = ' + item.distrito, [], function (tx, result) { 
							if (result.rows.length > 0) {
								var seccion = result.rows.item(0);
								line.set('localidad', seccion.nombre);
								line.set('enabled', true);

								_this.exportLinesHandler(lines);

								if (index == (lines.length - 1)) { 
									//_this.exportLines(lines);
								}
							} else {
								line.set('localidad', '');
								line.set('enabled', true);
								if (index == (lines.length - 1)) { 
									//_this.exportLines(lines);
								}
							}
						});
					} else {
						if (index == (lines.length - 1)) { 
							//_this.exportLines(lines);
						}								
					}
		  		});
			});
		});
	},	



	exportLinesHandler: function (lines) {
		var _this = this;
		if (this.get('interval')) {
			clearInterval(this.get('interval'));
		}
		var interval = setInterval(function(){ 
			_this.exportLines(lines);
			clearInterval(_this.get('interval'));
		}, 1000);
		this.set('interval', interval);
	},


	exportLines : function (lines) {
		var csvContent = "APELLIDO;NOMBRE;DOCUMENTO;SEXO;DOMICILIO;LOCALIDAD;PROVINCIA\n";
		var _this = this;
 		lines.forEach(function(rec) {
 			if (rec.get('nombre')) {
	   			var dataString = rec.get('apellido') + ";" + rec.get('nombre') + ";" + rec.get('documento') + ";" + rec.get('sexo') + ";" + rec.get('domicilio') + ";" + rec.get('localidad') + ";" + rec.get('provincia');
	   			csvContent += dataString + "\n";
 			}
 		});

		var encodedUri = encodeURI(csvContent);

		var content = new Buffer(csvContent, 'utf-8');

	    var chooser = $('#export')[0];
	    chooser.addEventListener("change", function(evt) {
		    var fs = require('fs');// save it now
			fs.writeFile(this.value, content, function(err) {
				_this.set('isCreating', true);
			    if(err) {
			       alert("error"+err);
			    }
			});
	    }, false);
	    this.set('processing', false);
	    chooser.click();
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
