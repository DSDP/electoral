import Ember from 'ember';

function getCSV(url) {
  return new Promise(function(resolve, reject){
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url);
    xhr.onreadystatechange = handler;
    xhr.send();

    function handler() {
      if (this.readyState === this.DONE) {
        if (this.status === 0) {
          resolve(this.response);
        } else {
          reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
        }
      }
    };
  });
}

export default Ember.Route.extend({
	actions: {
		close: function () {
			var gui = require('nw.gui');
			gui.App.quit();
		}		
	},

	setupController: function (controller, model) {
		this._super(controller, model);
		controller.set('loading', true);
		Ember.run.later(function () {
			var gui = require('nw.gui');
			var db = openDatabase(gui.App.dataPath + '/padron.db', '0', '', 5000 * 1024 * 1024);

		    controller.set('db', db);
		    Ember.run.later(function () {
		    	controller.set('loading', false);
			    gui.Window.get().resizeTo(1024, 768);
			    gui.Window.get().setPosition('center');
		    }, 3000)
		}, 500);
	},
});