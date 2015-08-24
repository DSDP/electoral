import Ember from 'ember';

export default Ember.View.extend({

	avalLines: [],
	currentLine: 0,
	automatic: false,
	delayEntry: 1500,

	actions: {
	
		process: function  () {
			var _this = this;
			this.set('currentLine', 0);
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
		},			
	},


	proccesLines: function  (lines ) {
		var _this = this;
		this.set('avalLines', lines);
		alert('Ya puedes comenzar chaval!!!');
	},	

	didInsertElement: function () {
		this._super();
		var _this = this;
		this.$('#avales').load(function () {
			var content = _this.$('#avales').contents();
			var frame = $('frame[name="botonera"]', content)[0];
			if (frame) {
			 	$('frame[name="botonera"]', content).load(function(){
			 		if ($('a[onclick="do_grabar();"]', this.contentDocument)) {
			 			if (_this.get('automatic')) {
			 				var self = this;
			 				Ember.run.later(function () {
			 					$('a[onclick="do_grabar();"]', self.contentDocument).click();
			 				}, _this.get('delayEntry'))
			 			}
			 			_this.set('currentLine', parseInt(_this.get('currentLine')) + 1);
			 		}
					/*$('a[onclick="do_grabar();"]', this.contentDocument).click(function () {
						_this.set('currentLine', _this.get('currentLine') + 1);
					});
*/
			    });				
			}

			var frameCentral = $('frame[name="central"]', content)[0];
			if (frame) {
			 	$('frame[name="central"]', content).load(function(){

					if (_this.get('avalLines')) {
						var avalLine = _this.get('avalLines').objectAt(_this.get('currentLine'));
						var self = this;
						Ember.run.next(function () {
							$('input[name="apyn"]', self.contentDocument).val(avalLine.get('apellido') + " " + avalLine.get('nombre'));
							$('input[name="nro_doc"]', self.contentDocument).val(avalLine.get('documento'));
							$('select[name="sexo"]', self.contentDocument).val(avalLine.get('sexo'));
						});
					}					
			    });				
			}			
		});
	}
});
