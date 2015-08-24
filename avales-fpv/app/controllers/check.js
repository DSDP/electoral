import Ember from 'ember';

export default Ember.Controller.extend({
	result: null,
	provinces: ["CAPITAL FEDERAL","BUENOS AIRES","CATAMARCA","CORDOBA","CORRIENTES","CHACO","CHUBUT","ENTRE RIOS","FORMOSA","JUJUY","LA PAMPA","LA RIOJA","MENDOZA","MISIONES","NEUQUEN","RIO NEGRO","SALTA","SAN JUAN","SAN LUIS","SANTA CRUZ","SANTA FE","SANTIAGO DEL ESTERO","TUCUMAN","TIERRA DEL FUEGO"],
	page: 1,
	perPage: 6,
	needs: ['application'],
	processing: false,

	actions: {
		showError: function () {
			this.set('showErrors', true);
		},

		nextPage: function () {
			this.set('page', parseInt(this.get('page')) + 1);
		},

		prevPage: function () {
			this.set('page', parseInt(this.get('page')) - 1);
		},		

		process: function  () {
			var _this = this;
			var fr = new FileReader();
			var fileInputElement = document.getElementById("file");
			fr.readAsText(fileInputElement.files[0]);	
			this.set('result', null);
			this.set('page', 1);
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
			            	lineNumber: i + 1,
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
		var rNombre = new RegExp(/^([a-z ñáéíóúÑ.']{2,60})$/i);
		var rApellido = new RegExp(/^([a-z ñáéíóúÑ.']{2,60})$/i);
		var rDni = new RegExp(/^\d{2,8}?$/);
		var rProvincia = new RegExp("");
		var rLocalidad = new RegExp(/^[a-zA-Z ñáéíóúÑ.]+(?:[\s-][a-zA-Z]+)*$/);
		var rSexo = new RegExp(/^M|F$/);
		var rDireccion = new RegExp(/^[A-Za-z0-9 ñáéíóúÑ\(\).'\.\-\s\,]/);
		var result = this.get('result');

		result = Ember.Object.create({
			okLines: 0,
			errLines: 0,
			totalLines: lines.length,
			status: 'OK',
			errors: [],
			provincePrecense: []
		});


		_this.get('controllers.application.db').transaction(function (tx) { 
			lines.forEach(function (line, index) {
				var matricula = line.get('documento');
				if (!matricula) {
					matricula = 999999999;
				}
				
		  		tx.executeSql('SELECT * FROM afiliado_pj where matricula =' + matricula, [], function (tx, results) {
					var isOk = true;
					var errLine = Ember.Object.create({
						number: line.get('lineNumber'),
						fields: [],
					});

					if (!rDni.test(parseInt(line.get('documento')))) {
						isOk = false;
						errLine.get('fields').push('documento');
					} else {
			  			if (results.rows.length == 0) {
							isOk = false;
							errLine.get('fields').push('No existe en el padron');
			  			} 
					}
					
					if (!rNombre.test(line.get('nombre'))) {
						isOk = false;
						errLine.get('fields').push('Nombre');
					}

					if (!rApellido.test(line.get('apellido'))) {
						isOk = false;
						errLine.get('fields').push('apellido');
					}

					if (_this.get('provinces').indexOf(line.get('provincia')) < 0) {
						isOk = false;
						errLine.get('fields').push('provincia');
					} else {
						var p = result.get('provincePrecense').findProperty('name', line.get('provincia'));
						if (!p) {
							p = Ember.Object.create({
								name: line.get('provincia'),
								count: 0
							});
							result.get('provincePrecense').pushObject(p);
						}
						p.set('count', p.get('count') + 1);
					}

					if (!rLocalidad.test(line.get('localidad'))) {
						isOk = false;
						errLine.get('fields').push('localidad');
					}

					if (!rSexo.test(line.get('sexo'))) {
						isOk = false;
						errLine.get('fields').push('sexo');
					}

					if (!rDireccion.test(line.get('domicilio'))) {
						isOk = false;
						errLine.get('fields').push('domicilio');
					}

					if (!isOk) {
						result.set('errLines', result.get('errLines') + 1);
						result.get('errors').pushObject(errLine);
					} else {
						result.set('okLines', result.get('okLines') + 1);
					}


					if (index == (lines.length - 1)) {
						if (result.get('provincePrecense.length') < 5) {
							result.set('status', 'No cumple con el minimo de provincias.');
						}
						if (result.get('errLines') > 0) {
							result.set('status', 'Se encontraron ' +  result.get('errors').length + " avales invalidos.");
						}
						_this.set('processing', false);
						_this.set('result', result);
					}
				});
			});

			
		});

	},

	errors: Ember.computed('page', 'result.errors', 'perPage', 'processing', function () {
		if (this.get('result')) {
			var d = this.get('perPage') * (this.get('page') - 1);
			var h = this.get('perPage') * this.get('page');
			return this.get('result').errors.slice(d, h);
		} else {
			return null;
		}
	}),

	errorsPages: Ember.computed('result.errors', 'perPage', 'processing', function () {
		if (this.get('result')) {
			return Math.ceil(this.get('result.errors').get('length') / this.get('perPage'));
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
