const _ = require('lodash');

class NameGenerator {
    viewNameFromProp(p) {
        let camelCasedName = _.upperFirst(p.name);
        if (p.type === 'array') {
            camelCasedName += 'List';
        }
        const viewName = camelCasedName.endsWith('View') ? camelCasedName : `${camelCasedName}View`;
        return viewName;
    }
    listItemViewName(p) {
        const camelCasedName = `${_.upperFirst(p.typeClass)}ListItem`;
        const viewName = camelCasedName.endsWith('View') ? camelCasedName : `${camelCasedName}View`;
        return viewName;
    }
    viewPropName(p) {
        return _.camelCase(p.name);
    }
    isPrimitiveType(type) {
        switch(type) {
            case 'number':
            case 'string':
            case 'bool':
                return true;
            default:
                return false;
        }
    }
}

module.exports = NameGenerator;