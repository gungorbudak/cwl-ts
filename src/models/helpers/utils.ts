import {ID_REGEX} from "./constants";
export const ensureArray = (map: { [key: string]: any }
                                | any[]
                                | string
                                | number
                                | boolean, key?: string, valueKey?: string): any[] => {
    // object is not defined or is null, return an empty array
    if (map === undefined || map === null) return [];

    if (Array.isArray(map)) {
        // if the object is already an array of objects, we don't want to transform it
        if (typeof map[0] === "object" || key === undefined) {
            return [...map];
        } else {
            // if it's an array of something else, transform each element into {key: <any>item}
            return map.map(item => ({[key]: item}));
        }
    }

    // if the object is a primitive, wrap it in an array
    if (typeof map === "string" || typeof map === "number" || typeof map === "boolean") {
        return [map];
    }

    // if the object is a hashmap, transform it accordingly
    return Object.keys(map).map(prop => {
        /*
         if a valueKey is provided and the property isn't already an object, create an object from the valueKey
         e.g.: map = {foo: "bar"}, key = "id", valueKey = "type"

         return value is [ {id: "foo", type: "bar"} ];
         */
        if (valueKey && checkMapValueType(map) !== "object" && checkValueType(map[prop]) !== "object") {
            return {... {[valueKey]: map[prop]}, ...{[key]: prop}};
        }

        /*
         if they property is already an object, add its hashmap key under the property key provided as a param
         e.g.: map = {foo: {bar: "baz"}}, key = "id", valueKey = "type"

         return value is [ {id: "foo", bar: "baz"} ];
         */
        return {... map[prop], ...{[key]: prop}};
    });
};

/**
 * Checks the type of each property in a hashMap. Returns "mismatch" if property types are mixed,
 * otherwise returns type that corresponds to all properties.
 */
export const checkMapValueType = (map: { [key: string]: any }): "string"
    | "number"
    | "undefined"
    | "object"
    | "array"
    | "null"
    | "mismatch" => {
    let type = null;

    Object.keys(map).forEach((key) => {
        let valType = checkValueType(map[key]);

        if (type && valType !== type) {
            type = "mismatch";
            return type;
        } else {
            type = valType;
        }
    });

    return type;
};

export const checkValueType = (value: any): "string"
    | "number"
    | "undefined"
    | "object"
    | "array"
    | "null" => {
    let valType;

    if (Array.isArray(value)) {
        valType = "array";
    } else if (value === null) {
        valType = "null";
    } else if (typeof value === "object") {
        valType = "object";
    } else {
        valType = typeof value;
    }

    return valType;
};

export const incrementString = (str: string): string => {
    const replaced = str.replace(/^(.*?)(\d+$)/gi, function (all, $1, $2) {
        return $1 + ++$2;
    });

    if (replaced === str) return str + "_1";
    return replaced;
};

export const spreadAllProps = (destObj: Object, sourceObj: Object): any => {
    return {...{}, ...destObj, ...sourceObj};
};

export const spreadSelectProps = (sourceObj: Object, destObj: Object, keys: string[]): void => {
    Object.keys(sourceObj).forEach(key => {
        if (keys.indexOf(key) === -1 && sourceObj[key] !== undefined) {
            destObj[key] = sourceObj[key];
        }
    });
};

export const intersection = (arrA: Array<any> = [], arrB: Array<any> = []): Array<any> => {
    return arrA.filter(item => {
        return arrB.indexOf(item) !== -1;
    });
};

export const commaSeparatedToArray = (str: string | string[]): string[] => {
    if (!str) return [];
    if (Array.isArray(str)) return str;

    return str.replace(/\s/g, "").split(",");
};

export const snakeCase = (str: string = ""): string => {
    return str.replace(/[\s.\[\/\]-]+/g, "_").replace(/([A-Z])/g, (match) => "_" + match.toLowerCase());
};

export const isEmpty = (obj: Object | any[]): boolean => {
    if (Array.isArray(obj)) {
        return obj.length === 0;
    } else if (typeof obj === "object" && obj !== null) {
        return Object.keys(obj).length === 0;
    }
};

export const fetchByLoc = (obj: any, loc: string): any => {
    // change "foo.bar[3]['baz']" to "foo.bar.3.'baz'"
    loc             = loc.replace("[", ".[").replace(/[\[\]]/g, "");
    // to ["foo", "bar", "3", "'baz'"]
    const tokens    = loc.split(".").filter(tok => tok.length);
    let result: any = obj;

    while (tokens.length) {
        // take first token, remove quotes
        const token = tokens.shift().replace(/["']/g, "");

        // attempt to access property
        try {
            // if token is number, cast to int
            if (!isNaN(<any> token)) {
                result = result[parseInt(token, 10)]
            } else {
                // otherwise access property
                result = result[token];
            }
        } catch (ex) {
            // if property doesn't exist, return undefined
            return undefined;
        }
    }

    return result;
};

export const cleanupNull = (obj: Object): any => {
    const keys = Object.keys(obj);
    let tmp    = {...obj};
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (obj[key] === undefined || obj[key] === null) {
            delete tmp[key];
        }
    }

    return tmp;
};

export const nullifyObjValues = (obj: Object): any => {
    const keys = Object.keys(obj);
    let tmp = {...obj};
    for (let i = 0; i < keys.length; i++) {
        tmp[keys[i]] = null;
    }

    return tmp;
};

export const validateID = (id: string) => {
    if (!id) {
        throw new Error("ID must be set");
    }

    if (!ID_REGEX.test(id)) {
        throw new Error(`ID "${id}" is invalid, ID must start with a letter and only alphanumerics and _ are allowed`);
    }
};

export const incrementLastLoc = (items: {loc: string}[] = [], prefix: string) => {
    if (items.length === 0){
        return `${prefix}[0]`
    }

    const lastItem = items[items.length - 1];

    let match:any = ((lastItem.loc.match(/\[(\d+)]$/g) || [""])[0].match(/\d+/g) || [""])[0];

    if (!match) return null;

    match = parseInt(match);

    return `${prefix}[${++match}]`;
};