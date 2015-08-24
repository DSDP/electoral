import DS from 'ember-data';

export default DS.Model.extend({
	lineNumber: DS.attr('string'),
	sectionNumber: DS.attr('string'),
	townName: DS.attr('string'),
	avalesEntry: DS.attr('string'),
	avalesNeed: DS.attr('string')
});
