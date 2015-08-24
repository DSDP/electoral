import DS from 'ember-data';

export default DS.Model.extend({
  	"nombre y apellido": DS.attr('string'),
  	documento: DS.attr('number'),
  	sexo: DS.attr('string'),
  	domicilio: DS.attr('string'),
  	provincia: DS.attr('string'),
  	localidad: DS.attr('string'),
});
