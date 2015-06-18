'use strict';

var Joi = require('joi'),
	_ = require('lodash');

/**
 * Validation helpers for Joi.
 * @module
 */

/** @type {Joi} A shortcut to a Joi instance. */
exports.joi = Joi;

/** @type {Joi} Validates a slug, converts it to lowercase automatically. */
exports.slug = Joi.string().lowercase().regex(/^[a-z0-9-]{3,100}$/).options({
	language: {
		string: {
			regex: 'must be alphanumerical and 3-100 characters long.'
		}
	}
});

/** @type {Joi} Validates an ID. */
exports.id = Joi.number().positive().integer();

/** @type {Joi} Validates a text, trimming whitespace. */
exports.text = Joi.string().trim();

/** @type {Joi} Validates a VARCHAR(255) string. */
exports.varchar255 = exports.text.max(255);

/**
 * Validate set of params
 * @param   {Object} obj The parameters to validate. For example
 *                       { id: 'id' } will validate against id above.
 *                       Or you can just say params('id')
 * @returns {Joi}
 */
exports.params = function (/*obj | key1, key2, ...*/) {
	return Joi.object(convertToSchema.apply(null, arguments));
};

/**
 * Extend a Joi object with new schema.
 * @param   {Object} obj The parameters to validate. For example
 *                       { id: 'id' } will validate against id above.
 *                       Or you can just say params('id')
 * @returns {Joi}
 */
exports.extend = function (obj, newSchema) {
	if (!obj.isJoi) throw new TypeError('Object must be a Joi object.');
	return obj.keys(convertToSchema(newSchema));
};

/**
 * Validates an array just like Joi.array().items(...).single().
 * But accepts references to helpers types: validate.arrayOf('id').
 * @param  {Joi} schema... Schemas to accept
 * @return {Joi}
 */
exports.arrayOf = function () {
	var schemas = _.map(arguments, function (a) {
		if (typeof a === 'string') return getSchema(a)[1];
		else if (typeof a === 'object' && !a.isJoi) return exports.params(a);
		else return a;
	});
	return Joi.array().items(schemas).single();
};

/**
 * Add your own type helper.
 * @param  {String} name   Name of the helper
 * @param  {Joi}    schema The schema
 */
exports.mixin = function (name, schema) {
	if (!schema.isJoi) throw new TypeError('Schema must be a Joi object.');
	exports[name] = schema;
};

/** @type {Object} Just for sugar. */
exports.a = _.create(exports);
exports.an = _.create(exports);

// Private helper functions.
////

function getSchema(key) {
	var matches = key.match(/^\[(.*)\]$/); // key in [] is optional
	if (matches) return [matches[1], exports[matches[1]].optional()];
	return [key, exports[key].required()];
}

function convertToSchema(obj/* | key1, key2, ...*/) {
	var schema;

	if (typeof obj === 'object') {
		schema = _(obj).map(function (value, key) {
			if (typeof value === 'string')
				return [key, getSchema(value)[1]];
			else if (value.isJoi || Array.isArray(value))
				return [key, value];
		});
	} else schema = _(arguments).map(getSchema);

	return schema.zipObject().valueOf();
}