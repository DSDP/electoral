import DS from 'ember-data';

export default DS.Model.extend({
	operatorNumber: DS.attr('string'),
	lineNumber: DS.attr('string'),
	dni: DS.attr('string'),
	fullName: DS.attr('string'),
	sex: DS.attr('string')
});
