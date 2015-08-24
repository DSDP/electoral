import Ember from 'ember';

export default Ember.Route.extend({

	enter: function () {
		var gui = require('nw.gui');
		gui.Window.get().enterKioskMode();
	},

	actions: {
		close: function () {
			var gui = require('nw.gui');
			gui.Window.get().leaveKioskMode();
			gui.App.quit();
		}		
	}
});
