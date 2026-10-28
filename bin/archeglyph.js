#!/usr/bin/env node
// SPDX-License-Identifier: MPL-2.0
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/external.js
var exports_external = {};
__export(exports_external, {
  void: () => voidType,
  util: () => util,
  unknown: () => unknownType,
  union: () => unionType,
  undefined: () => undefinedType,
  tuple: () => tupleType,
  transformer: () => effectsType,
  symbol: () => symbolType,
  string: () => stringType,
  strictObject: () => strictObjectType,
  setErrorMap: () => setErrorMap,
  set: () => setType,
  record: () => recordType,
  quotelessJson: () => quotelessJson,
  promise: () => promiseType,
  preprocess: () => preprocessType,
  pipeline: () => pipelineType,
  ostring: () => ostring,
  optional: () => optionalType,
  onumber: () => onumber,
  oboolean: () => oboolean,
  objectUtil: () => objectUtil,
  object: () => objectType,
  number: () => numberType,
  nullable: () => nullableType,
  null: () => nullType,
  never: () => neverType,
  nativeEnum: () => nativeEnumType,
  nan: () => nanType,
  map: () => mapType,
  makeIssue: () => makeIssue,
  literal: () => literalType,
  lazy: () => lazyType,
  late: () => late,
  isValid: () => isValid,
  isDirty: () => isDirty,
  isAsync: () => isAsync,
  isAborted: () => isAborted,
  intersection: () => intersectionType,
  instanceof: () => instanceOfType,
  getParsedType: () => getParsedType,
  getErrorMap: () => getErrorMap,
  function: () => functionType,
  enum: () => enumType,
  effect: () => effectsType,
  discriminatedUnion: () => discriminatedUnionType,
  defaultErrorMap: () => en_default,
  datetimeRegex: () => datetimeRegex,
  date: () => dateType,
  custom: () => custom,
  coerce: () => coerce,
  boolean: () => booleanType,
  bigint: () => bigIntType,
  array: () => arrayType,
  any: () => anyType,
  addIssueToContext: () => addIssueToContext,
  ZodVoid: () => ZodVoid,
  ZodUnknown: () => ZodUnknown,
  ZodUnion: () => ZodUnion,
  ZodUndefined: () => ZodUndefined,
  ZodType: () => ZodType,
  ZodTuple: () => ZodTuple,
  ZodTransformer: () => ZodEffects,
  ZodSymbol: () => ZodSymbol,
  ZodString: () => ZodString,
  ZodSet: () => ZodSet,
  ZodSchema: () => ZodType,
  ZodRecord: () => ZodRecord,
  ZodReadonly: () => ZodReadonly,
  ZodPromise: () => ZodPromise,
  ZodPipeline: () => ZodPipeline,
  ZodParsedType: () => ZodParsedType,
  ZodOptional: () => ZodOptional,
  ZodObject: () => ZodObject,
  ZodNumber: () => ZodNumber,
  ZodNullable: () => ZodNullable,
  ZodNull: () => ZodNull,
  ZodNever: () => ZodNever,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNaN: () => ZodNaN,
  ZodMap: () => ZodMap,
  ZodLiteral: () => ZodLiteral,
  ZodLazy: () => ZodLazy,
  ZodIssueCode: () => ZodIssueCode,
  ZodIntersection: () => ZodIntersection,
  ZodFunction: () => ZodFunction,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodError: () => ZodError,
  ZodEnum: () => ZodEnum,
  ZodEffects: () => ZodEffects,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodDefault: () => ZodDefault,
  ZodDate: () => ZodDate,
  ZodCatch: () => ZodCatch,
  ZodBranded: () => ZodBranded,
  ZodBoolean: () => ZodBoolean,
  ZodBigInt: () => ZodBigInt,
  ZodArray: () => ZodArray,
  ZodAny: () => ZodAny,
  Schema: () => ZodType,
  ParseStatus: () => ParseStatus,
  OK: () => OK,
  NEVER: () => NEVER,
  INVALID: () => INVALID,
  EMPTY_PATH: () => EMPTY_PATH,
  DIRTY: () => DIRTY,
  BRAND: () => BRAND
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {};
  function assertIs(_arg) {}
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error;
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== undefined) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === en_default ? undefined : en_default
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/types.js
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}

class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};

class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};

class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};

class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};

class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};

class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};

class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};

class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : undefined,
          maximum: tooBig ? def.exactLength.value : undefined,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}

class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {} else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== undefined ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};

class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  static create(discriminator, options, params) {
    const optionsMap = new Map;
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}

class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};

class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}

class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = new Map;
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = new Map;
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};

class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = new Set;
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};

class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}

class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};

class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};

class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};

class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};

class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");

class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}

class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}

class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
// packages/ops/src/op.ts
var consoleLogger = {
  info: (m) => process.stderr.write(`${m}
`),
  warn: (m) => process.stderr.write(`warning: ${m}
`),
  error: (m) => process.stderr.write(`error: ${m}
`)
};
function createOpContext(projectRoot) {
  return {
    projectRoot: projectRoot ?? process.cwd(),
    logger: consoleLogger
  };
}
async function dispatchCli(op, params, ctx) {
  const output = await op.execute(params, ctx);
  const text = op.format(output);
  if (text.length > 0)
    process.stdout.write(text + `
`);
  return op.exitCode?.(output) ?? 0;
}
// packages/ops/src/render/op.ts
import { access, readFile as readFile2, writeFile } from "node:fs/promises";
import { extname, basename as basename2, dirname as dirname2, join as join2, resolve as resolve2 } from "node:path";

// packages/proto/src/util/result.ts
function Ok(value) {
  return { kind: "ok", value };
}
function Err(error) {
  return { kind: "err", error };
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/reflect/names.js
function protoCamelCase(snakeCase) {
  let capNext = false;
  const b = [];
  for (let i = 0;i < snakeCase.length; i++) {
    let c = snakeCase.charAt(i);
    switch (c) {
      case "_":
        capNext = true;
        break;
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        b.push(c);
        capNext = false;
        break;
      default:
        if (capNext) {
          capNext = false;
          c = c.toUpperCase();
        }
        b.push(c);
        break;
    }
  }
  return b.join("");
}
function protoSnakeCase(lowerCamelCase) {
  return lowerCamelCase.replace(/[A-Z]/g, (letter) => "_" + letter.toLowerCase());
}
var reservedObjectProperties = new Set([
  "constructor",
  "toString",
  "toJSON",
  "valueOf"
]);
function safeObjectProperty(name) {
  return reservedObjectProperties.has(name) ? name + "$" : name;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wire/varint.js
function varint64read() {
  let lowBits = 0;
  let highBits = 0;
  for (let shift = 0;shift < 28; shift += 7) {
    let b = this.buf[this.pos++];
    lowBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  let middleByte = this.buf[this.pos++];
  lowBits |= (middleByte & 15) << 28;
  highBits = (middleByte & 112) >> 4;
  if ((middleByte & 128) == 0) {
    this.assertBounds();
    return [lowBits, highBits];
  }
  for (let shift = 3;shift <= 31; shift += 7) {
    let b = this.buf[this.pos++];
    highBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  throw new Error("invalid varint");
}
function varint64write(lo, hi, bytes) {
  for (let i = 0;i < 28; i = i + 7) {
    const shift = lo >>> i;
    const hasNext = !(shift >>> 7 == 0 && hi == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
  const hasMoreBits = !(hi >> 3 == 0);
  bytes.push((hasMoreBits ? splitBits | 128 : splitBits) & 255);
  if (!hasMoreBits) {
    return;
  }
  for (let i = 3;i < 31; i = i + 7) {
    const shift = hi >>> i;
    const hasNext = !(shift >>> 7 == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  bytes.push(hi >>> 31 & 1);
}
var TWO_PWR_32_DBL = 4294967296;
function int64FromString(dec) {
  const minus = dec[0] === "-";
  if (minus) {
    dec = dec.slice(1);
  }
  const base = 1e6;
  let lowBits = 0;
  let highBits = 0;
  function add1e6digit(begin, end) {
    const digit1e6 = Number(dec.slice(begin, end));
    highBits *= base;
    lowBits = lowBits * base + digit1e6;
    if (lowBits >= TWO_PWR_32_DBL) {
      highBits = highBits + (lowBits / TWO_PWR_32_DBL | 0);
      lowBits = lowBits % TWO_PWR_32_DBL;
    }
  }
  add1e6digit(-24, -18);
  add1e6digit(-18, -12);
  add1e6digit(-12, -6);
  add1e6digit(-6);
  return minus ? negate(lowBits, highBits) : newBits(lowBits, highBits);
}
function int64ToString(lo, hi) {
  let bits = newBits(lo, hi);
  const negative = bits.hi & 2147483648;
  if (negative) {
    bits = negate(bits.lo, bits.hi);
  }
  const result = uInt64ToString(bits.lo, bits.hi);
  return negative ? "-" + result : result;
}
function uInt64ToString(lo, hi) {
  ({ lo, hi } = toUnsigned(lo, hi));
  if (hi <= 2097151) {
    return String(TWO_PWR_32_DBL * hi + lo);
  }
  const low = lo & 16777215;
  const mid = (lo >>> 24 | hi << 8) & 16777215;
  const high = hi >> 16 & 65535;
  let digitA = low + mid * 6777216 + high * 6710656;
  let digitB = mid + high * 8147497;
  let digitC = high * 2;
  const base = 1e7;
  if (digitA >= base) {
    digitB += Math.floor(digitA / base);
    digitA %= base;
  }
  if (digitB >= base) {
    digitC += Math.floor(digitB / base);
    digitB %= base;
  }
  return digitC.toString() + decimalFrom1e7WithLeadingZeros(digitB) + decimalFrom1e7WithLeadingZeros(digitA);
}
function toUnsigned(lo, hi) {
  return { lo: lo >>> 0, hi: hi >>> 0 };
}
function newBits(lo, hi) {
  return { lo: lo | 0, hi: hi | 0 };
}
function negate(lowBits, highBits) {
  highBits = ~highBits;
  if (lowBits) {
    lowBits = ~lowBits + 1;
  } else {
    highBits += 1;
  }
  return newBits(lowBits, highBits);
}
var decimalFrom1e7WithLeadingZeros = (digit1e7) => {
  const partial = String(digit1e7);
  return "0000000".slice(partial.length) + partial;
};
function varint32write(value, bytes) {
  if (value >= 0) {
    while (value > 127) {
      bytes.push(value & 127 | 128);
      value = value >>> 7;
    }
    bytes.push(value);
  } else {
    for (let i = 0;i < 9; i++) {
      bytes.push(value & 127 | 128);
      value = value >> 7;
    }
    bytes.push(1);
  }
}
function varint32read() {
  let b = this.buf[this.pos++];
  let result = b & 127;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 7;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 14;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 21;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 15) << 28;
  for (let readBytes = 5;(b & 128) !== 0 && readBytes < 10; readBytes++)
    b = this.buf[this.pos++];
  if ((b & 128) != 0)
    throw new Error("invalid varint");
  this.assertBounds();
  return result >>> 0;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
var protoInt64 = /* @__PURE__ */ makeInt64Support();
function makeInt64Support() {
  const dv = new DataView(new ArrayBuffer(8));
  const ok = typeof BigInt === "function" && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function" && (!!globalThis.Deno || typeof process != "object" || typeof process.env != "object" || process.env.BUF_BIGINT_DISABLE !== "1");
  if (ok) {
    const MIN = BigInt("-9223372036854775808");
    const MAX = BigInt("9223372036854775807");
    const UMIN = BigInt("0");
    const UMAX = BigInt("18446744073709551615");
    return {
      zero: BigInt(0),
      supported: true,
      parse(value) {
        const bi = typeof value == "bigint" ? value : BigInt(value);
        if (bi > MAX || bi < MIN) {
          throw new Error(`invalid int64: ${value}`);
        }
        return bi;
      },
      uParse(value) {
        const bi = typeof value == "bigint" ? value : BigInt(value);
        if (bi > UMAX || bi < UMIN) {
          throw new Error(`invalid uint64: ${value}`);
        }
        return bi;
      },
      enc(value) {
        dv.setBigInt64(0, this.parse(value), true);
        return {
          lo: dv.getInt32(0, true),
          hi: dv.getInt32(4, true)
        };
      },
      uEnc(value) {
        dv.setBigInt64(0, this.uParse(value), true);
        return {
          lo: dv.getInt32(0, true),
          hi: dv.getInt32(4, true)
        };
      },
      dec(lo, hi) {
        dv.setInt32(0, lo, true);
        dv.setInt32(4, hi, true);
        return dv.getBigInt64(0, true);
      },
      uDec(lo, hi) {
        dv.setInt32(0, lo, true);
        dv.setInt32(4, hi, true);
        return dv.getBigUint64(0, true);
      }
    };
  }
  return {
    zero: "0",
    supported: false,
    parse(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertInt64String(value);
      return value;
    },
    uParse(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertUInt64String(value);
      return value;
    },
    enc(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertInt64String(value);
      return int64FromString(value);
    },
    uEnc(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertUInt64String(value);
      return int64FromString(value);
    },
    dec(lo, hi) {
      return int64ToString(lo, hi);
    },
    uDec(lo, hi) {
      return uInt64ToString(lo, hi);
    }
  };
}
function assertInt64String(value) {
  if (!/^-?[0-9]+$/.test(value)) {
    throw new Error("invalid int64: " + value);
  }
}
function assertUInt64String(value) {
  if (!/^[0-9]+$/.test(value)) {
    throw new Error("invalid uint64: " + value);
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/descriptors.js
var ScalarType;
(function(ScalarType2) {
  ScalarType2[ScalarType2["DOUBLE"] = 1] = "DOUBLE";
  ScalarType2[ScalarType2["FLOAT"] = 2] = "FLOAT";
  ScalarType2[ScalarType2["INT64"] = 3] = "INT64";
  ScalarType2[ScalarType2["UINT64"] = 4] = "UINT64";
  ScalarType2[ScalarType2["INT32"] = 5] = "INT32";
  ScalarType2[ScalarType2["FIXED64"] = 6] = "FIXED64";
  ScalarType2[ScalarType2["FIXED32"] = 7] = "FIXED32";
  ScalarType2[ScalarType2["BOOL"] = 8] = "BOOL";
  ScalarType2[ScalarType2["STRING"] = 9] = "STRING";
  ScalarType2[ScalarType2["BYTES"] = 12] = "BYTES";
  ScalarType2[ScalarType2["UINT32"] = 13] = "UINT32";
  ScalarType2[ScalarType2["SFIXED32"] = 15] = "SFIXED32";
  ScalarType2[ScalarType2["SFIXED64"] = 16] = "SFIXED64";
  ScalarType2[ScalarType2["SINT32"] = 17] = "SINT32";
  ScalarType2[ScalarType2["SINT64"] = 18] = "SINT64";
})(ScalarType || (ScalarType = {}));

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/reflect/scalar.js
function scalarEquals(type, a, b) {
  if (a === b) {
    return true;
  }
  if (type == ScalarType.BYTES) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0;i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  switch (type) {
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      return a == b;
  }
  return false;
}
function scalarZeroValue(type, longAsString) {
  switch (type) {
    case ScalarType.STRING:
      return "";
    case ScalarType.BOOL:
      return false;
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
      return 0;
    case ScalarType.INT64:
    case ScalarType.UINT64:
    case ScalarType.SFIXED64:
    case ScalarType.FIXED64:
    case ScalarType.SINT64:
      return longAsString ? "0" : protoInt64.zero;
    case ScalarType.BYTES:
      return new Uint8Array(0);
    default:
      return 0;
  }
}
function isScalarZeroValue(type, value) {
  switch (type) {
    case ScalarType.BOOL:
      return value === false;
    case ScalarType.STRING:
      return value === "";
    case ScalarType.BYTES:
      return value instanceof Uint8Array && !value.byteLength;
    default:
      return value == 0;
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/reflect/unsafe.js
var IMPLICIT = 2;
var unsafeLocal = Symbol.for("reflect unsafe local");
function unsafeOneofCase(target, oneof) {
  const c = target[oneof.localName].case;
  if (c === undefined) {
    return c;
  }
  return oneof.fields.find((f) => f.localName === c);
}
function unsafeIsSet(target, field) {
  const name = field.localName;
  if (field.oneof) {
    return target[field.oneof.localName].case === name;
  }
  if (field.presence != IMPLICIT) {
    return target[name] !== undefined && Object.prototype.hasOwnProperty.call(target, name);
  }
  switch (field.fieldKind) {
    case "list":
      return target[name].length > 0;
    case "map":
      return Object.keys(target[name]).length > 0;
    case "scalar":
      return !isScalarZeroValue(field.scalar, target[name]);
    case "enum":
      return target[name] !== field.enum.values[0].number;
  }
  throw new Error("message field with implicit presence");
}
function unsafeIsSetExplicit(target, localName) {
  return Object.prototype.hasOwnProperty.call(target, localName) && target[localName] !== undefined;
}
function unsafeGet(target, field) {
  if (field.oneof) {
    const oneof = target[field.oneof.localName];
    if (oneof.case === field.localName) {
      return oneof.value;
    }
    return;
  }
  return target[field.localName];
}
function unsafeSet(target, field, value) {
  if (field.oneof) {
    target[field.oneof.localName] = {
      case: field.localName,
      value
    };
  } else {
    target[field.localName] = value;
  }
}
function unsafeClear(target, field) {
  const name = field.localName;
  if (field.oneof) {
    const oneofLocalName = field.oneof.localName;
    if (target[oneofLocalName].case === name) {
      target[oneofLocalName] = { case: undefined };
    }
  } else if (field.presence != IMPLICIT) {
    delete target[name];
  } else {
    switch (field.fieldKind) {
      case "map":
        target[name] = {};
        break;
      case "list":
        target[name] = [];
        break;
      case "enum":
        target[name] = field.enum.values[0].number;
        break;
      case "scalar":
        target[name] = scalarZeroValue(field.scalar, field.longAsString);
        break;
    }
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/codegenv2/restore-json-names.js
function restoreJsonNames(message) {
  for (const f of message.field) {
    if (!unsafeIsSetExplicit(f, "jsonName")) {
      f.jsonName = protoCamelCase(f.name);
    }
  }
  message.nestedType.forEach(restoreJsonNames);
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wire/text-format.js
function parseTextFormatEnumValue(descEnum, value) {
  const enumValue = descEnum.values.find((v) => v.name === value);
  if (!enumValue) {
    throw new Error(`cannot parse ${descEnum} default value: ${value}`);
  }
  return enumValue.number;
}
function parseTextFormatScalarValue(type, value) {
  switch (type) {
    case ScalarType.STRING:
      return value;
    case ScalarType.BYTES: {
      const u = unescapeBytesDefaultValue(value);
      if (u === false) {
        throw new Error(`cannot parse ${ScalarType[type]} default value: ${value}`);
      }
      return u;
    }
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      return protoInt64.parse(value);
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
      return protoInt64.uParse(value);
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
      switch (value) {
        case "inf":
          return Number.POSITIVE_INFINITY;
        case "-inf":
          return Number.NEGATIVE_INFINITY;
        case "nan":
          return Number.NaN;
        default:
          return parseFloat(value);
      }
    case ScalarType.BOOL:
      return value === "true";
    case ScalarType.INT32:
    case ScalarType.UINT32:
    case ScalarType.SINT32:
    case ScalarType.FIXED32:
    case ScalarType.SFIXED32:
      return parseInt(value, 10);
  }
}
function unescapeBytesDefaultValue(str) {
  const b = [];
  const input = {
    tail: str,
    c: "",
    next() {
      if (this.tail.length == 0) {
        return false;
      }
      this.c = this.tail[0];
      this.tail = this.tail.substring(1);
      return true;
    },
    take(n) {
      if (this.tail.length >= n) {
        const r = this.tail.substring(0, n);
        this.tail = this.tail.substring(n);
        return r;
      }
      return false;
    }
  };
  while (input.next()) {
    switch (input.c) {
      case "\\":
        if (input.next()) {
          switch (input.c) {
            case "\\":
              b.push(input.c.charCodeAt(0));
              break;
            case "b":
              b.push(8);
              break;
            case "f":
              b.push(12);
              break;
            case "n":
              b.push(10);
              break;
            case "r":
              b.push(13);
              break;
            case "t":
              b.push(9);
              break;
            case "v":
              b.push(11);
              break;
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7": {
              const s = input.c;
              const t = input.take(2);
              if (t === false) {
                return false;
              }
              const n = parseInt(s + t, 8);
              if (Number.isNaN(n)) {
                return false;
              }
              b.push(n);
              break;
            }
            case "x": {
              const s = input.c;
              const t = input.take(2);
              if (t === false) {
                return false;
              }
              const n = parseInt(s + t, 16);
              if (Number.isNaN(n)) {
                return false;
              }
              b.push(n);
              break;
            }
            case "u": {
              const s = input.c;
              const t = input.take(4);
              if (t === false) {
                return false;
              }
              const n = parseInt(s + t, 16);
              if (Number.isNaN(n)) {
                return false;
              }
              const chunk = new Uint8Array(4);
              const view = new DataView(chunk.buffer);
              view.setInt32(0, n, true);
              b.push(chunk[0], chunk[1], chunk[2], chunk[3]);
              break;
            }
            case "U": {
              const s = input.c;
              const t = input.take(8);
              if (t === false) {
                return false;
              }
              const tc = protoInt64.uEnc(s + t);
              const chunk = new Uint8Array(8);
              const view = new DataView(chunk.buffer);
              view.setInt32(0, tc.lo, true);
              view.setInt32(4, tc.hi, true);
              b.push(chunk[0], chunk[1], chunk[2], chunk[3], chunk[4], chunk[5], chunk[6], chunk[7]);
              break;
            }
          }
        }
        break;
      default:
        b.push(input.c.charCodeAt(0));
    }
  }
  return new Uint8Array(b);
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/reflect/nested-types.js
function* nestedTypes(desc) {
  switch (desc.kind) {
    case "file":
      for (const message of desc.messages) {
        yield message;
        yield* nestedTypes(message);
      }
      yield* desc.enums;
      yield* desc.services;
      yield* desc.extensions;
      break;
    case "message":
      for (const message of desc.nestedMessages) {
        yield message;
        yield* nestedTypes(message);
      }
      yield* desc.nestedEnums;
      yield* desc.nestedExtensions;
      break;
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/registry.js
function createFileRegistry(...args) {
  const registry = createBaseRegistry();
  if (!args.length) {
    return registry;
  }
  if ("$typeName" in args[0] && args[0].$typeName == "google.protobuf.FileDescriptorSet") {
    for (const file of args[0].file) {
      addFile(file, registry);
    }
    return registry;
  }
  if ("$typeName" in args[0]) {
    let recurseDeps = function(file) {
      const deps = [];
      for (const protoFileName of file.dependency) {
        if (registry.getFile(protoFileName) != null) {
          continue;
        }
        if (seen.has(protoFileName)) {
          continue;
        }
        const dep = resolve(protoFileName);
        if (!dep) {
          throw new Error(`Unable to resolve ${protoFileName}, imported by ${file.name}`);
        }
        if ("kind" in dep) {
          registry.addFile(dep, false, true);
        } else {
          seen.add(dep.name);
          deps.push(dep);
        }
      }
      return deps.concat(...deps.map(recurseDeps));
    };
    const input = args[0];
    const resolve = args[1];
    const seen = new Set;
    for (const file of [input, ...recurseDeps(input)].reverse()) {
      addFile(file, registry);
    }
  } else {
    for (const fileReg of args) {
      for (const file of fileReg.files) {
        registry.addFile(file);
      }
    }
  }
  return registry;
}
function createBaseRegistry() {
  const types2 = new Map;
  const extendees = new Map;
  const files = new Map;
  return {
    kind: "registry",
    types: types2,
    extendees,
    [Symbol.iterator]() {
      return types2.values();
    },
    get files() {
      return files.values();
    },
    addFile(file, skipTypes, withDeps) {
      files.set(file.proto.name, file);
      if (!skipTypes) {
        for (const type of nestedTypes(file)) {
          this.add(type);
        }
      }
      if (withDeps) {
        for (const f of file.dependencies) {
          this.addFile(f, skipTypes, withDeps);
        }
      }
    },
    add(desc) {
      if (desc.kind == "extension") {
        let numberToExt = extendees.get(desc.extendee.typeName);
        if (!numberToExt) {
          extendees.set(desc.extendee.typeName, numberToExt = new Map);
        }
        numberToExt.set(desc.number, desc);
      }
      types2.set(desc.typeName, desc);
    },
    get(typeName) {
      return types2.get(typeName);
    },
    getFile(fileName) {
      return files.get(fileName);
    },
    getMessage(typeName) {
      const t = types2.get(typeName);
      return (t === null || t === undefined ? undefined : t.kind) == "message" ? t : undefined;
    },
    getEnum(typeName) {
      const t = types2.get(typeName);
      return (t === null || t === undefined ? undefined : t.kind) == "enum" ? t : undefined;
    },
    getExtension(typeName) {
      const t = types2.get(typeName);
      return (t === null || t === undefined ? undefined : t.kind) == "extension" ? t : undefined;
    },
    getExtensionFor(extendee, no) {
      var _a;
      return (_a = extendees.get(extendee.typeName)) === null || _a === undefined ? undefined : _a.get(no);
    },
    getService(typeName) {
      const t = types2.get(typeName);
      return (t === null || t === undefined ? undefined : t.kind) == "service" ? t : undefined;
    }
  };
}
var EDITION_PROTO2 = 998;
var EDITION_PROTO3 = 999;
var EDITION_UNSTABLE = 9999;
var TYPE_STRING = 9;
var TYPE_GROUP = 10;
var TYPE_MESSAGE = 11;
var TYPE_BYTES = 12;
var TYPE_ENUM = 14;
var LABEL_REPEATED = 3;
var LABEL_REQUIRED = 2;
var JS_STRING = 1;
var IDEMPOTENCY_UNKNOWN = 0;
var EXPLICIT = 1;
var IMPLICIT2 = 2;
var LEGACY_REQUIRED = 3;
var PACKED = 1;
var DELIMITED = 2;
var OPEN = 1;
var VERIFY = 2;
var maximumEdition = 1001;
var featureDefaults = {
  998: {
    fieldPresence: 1,
    enumType: 2,
    repeatedFieldEncoding: 2,
    utf8Validation: 3,
    messageEncoding: 1,
    jsonFormat: 2,
    enforceNamingStyle: 2,
    defaultSymbolVisibility: 1
  },
  999: {
    fieldPresence: 2,
    enumType: 1,
    repeatedFieldEncoding: 1,
    utf8Validation: 2,
    messageEncoding: 1,
    jsonFormat: 1,
    enforceNamingStyle: 2,
    defaultSymbolVisibility: 1
  },
  1000: {
    fieldPresence: 1,
    enumType: 1,
    repeatedFieldEncoding: 1,
    utf8Validation: 2,
    messageEncoding: 1,
    jsonFormat: 1,
    enforceNamingStyle: 2,
    defaultSymbolVisibility: 1
  },
  1001: {
    fieldPresence: 1,
    enumType: 1,
    repeatedFieldEncoding: 1,
    utf8Validation: 2,
    messageEncoding: 1,
    jsonFormat: 1,
    enforceNamingStyle: 1,
    defaultSymbolVisibility: 2
  }
};
function addFile(proto, reg) {
  var _a, _b;
  const file = {
    kind: "file",
    proto,
    deprecated: (_b = (_a = proto.options) === null || _a === undefined ? undefined : _a.deprecated) !== null && _b !== undefined ? _b : false,
    edition: getFileEdition(proto),
    name: proto.name.replace(/\.proto$/, ""),
    dependencies: findFileDependencies(proto, reg),
    enums: [],
    messages: [],
    extensions: [],
    services: [],
    toString() {
      return `file ${proto.name}`;
    }
  };
  const mapEntriesStore = new Map;
  const mapEntries = {
    get(typeName) {
      return mapEntriesStore.get(typeName);
    },
    add(desc) {
      var _a2;
      assert(((_a2 = desc.proto.options) === null || _a2 === undefined ? undefined : _a2.mapEntry) === true);
      mapEntriesStore.set(desc.typeName, desc);
    }
  };
  for (const enumProto of proto.enumType) {
    addEnum(enumProto, file, undefined, reg);
  }
  for (const messageProto of proto.messageType) {
    addMessage(messageProto, file, undefined, reg, mapEntries);
  }
  for (const serviceProto of proto.service) {
    addService(serviceProto, file, reg);
  }
  addExtensions(file, reg);
  for (const mapEntry of mapEntriesStore.values()) {
    addFields(mapEntry, reg, mapEntries);
  }
  for (const message of file.messages) {
    addFields(message, reg, mapEntries);
    addExtensions(message, reg);
  }
  reg.addFile(file, true);
}
function addExtensions(desc, reg) {
  switch (desc.kind) {
    case "file":
      for (const proto of desc.proto.extension) {
        const ext = newField(proto, desc, reg);
        desc.extensions.push(ext);
        reg.add(ext);
      }
      break;
    case "message":
      for (const proto of desc.proto.extension) {
        const ext = newField(proto, desc, reg);
        desc.nestedExtensions.push(ext);
        reg.add(ext);
      }
      for (const message of desc.nestedMessages) {
        addExtensions(message, reg);
      }
      break;
  }
}
function addFields(message, reg, mapEntries) {
  const allOneofs = message.proto.oneofDecl.map((proto) => newOneof(proto, message));
  const oneofsSeen = new Set;
  for (const proto of message.proto.field) {
    const oneof = findOneof(proto, allOneofs);
    const field = newField(proto, message, reg, oneof, mapEntries);
    message.fields.push(field);
    message.field[field.localName] = field;
    if (oneof === undefined) {
      message.members.push(field);
    } else {
      oneof.fields.push(field);
      if (!oneofsSeen.has(oneof)) {
        oneofsSeen.add(oneof);
        message.members.push(oneof);
      }
    }
  }
  for (const oneof of allOneofs.filter((o) => oneofsSeen.has(o))) {
    message.oneofs.push(oneof);
  }
  for (const child of message.nestedMessages) {
    addFields(child, reg, mapEntries);
  }
}
function addEnum(proto, file, parent, reg) {
  var _a, _b, _c, _d, _e;
  const sharedPrefix = findEnumSharedPrefix(proto.name, proto.value);
  const desc = {
    kind: "enum",
    proto,
    deprecated: (_b = (_a = proto.options) === null || _a === undefined ? undefined : _a.deprecated) !== null && _b !== undefined ? _b : false,
    file,
    parent,
    open: true,
    name: proto.name,
    typeName: makeTypeName(proto, parent, file),
    value: {},
    values: [],
    sharedPrefix,
    toString() {
      return `enum ${this.typeName}`;
    }
  };
  desc.open = isEnumOpen(desc);
  reg.add(desc);
  for (const p of proto.value) {
    const name = p.name;
    desc.values.push(desc.value[p.number] = {
      kind: "enum_value",
      proto: p,
      deprecated: (_d = (_c = p.options) === null || _c === undefined ? undefined : _c.deprecated) !== null && _d !== undefined ? _d : false,
      parent: desc,
      name,
      localName: safeObjectProperty(sharedPrefix == undefined ? name : name.substring(sharedPrefix.length)),
      number: p.number,
      toString() {
        return `enum value ${desc.typeName}.${name}`;
      }
    });
  }
  ((_e = parent === null || parent === undefined ? undefined : parent.nestedEnums) !== null && _e !== undefined ? _e : file.enums).push(desc);
}
function addMessage(proto, file, parent, reg, mapEntries) {
  var _a, _b, _c, _d;
  const desc = {
    kind: "message",
    proto,
    deprecated: (_b = (_a = proto.options) === null || _a === undefined ? undefined : _a.deprecated) !== null && _b !== undefined ? _b : false,
    file,
    parent,
    name: proto.name,
    typeName: makeTypeName(proto, parent, file),
    fields: [],
    field: {},
    oneofs: [],
    members: [],
    nestedEnums: [],
    nestedMessages: [],
    nestedExtensions: [],
    toString() {
      return `message ${this.typeName}`;
    }
  };
  if (((_c = proto.options) === null || _c === undefined ? undefined : _c.mapEntry) === true) {
    mapEntries.add(desc);
  } else {
    ((_d = parent === null || parent === undefined ? undefined : parent.nestedMessages) !== null && _d !== undefined ? _d : file.messages).push(desc);
    reg.add(desc);
  }
  for (const enumProto of proto.enumType) {
    addEnum(enumProto, file, desc, reg);
  }
  for (const messageProto of proto.nestedType) {
    addMessage(messageProto, file, desc, reg, mapEntries);
  }
}
function addService(proto, file, reg) {
  var _a, _b;
  const desc = {
    kind: "service",
    proto,
    deprecated: (_b = (_a = proto.options) === null || _a === undefined ? undefined : _a.deprecated) !== null && _b !== undefined ? _b : false,
    file,
    name: proto.name,
    typeName: makeTypeName(proto, undefined, file),
    methods: [],
    method: {},
    toString() {
      return `service ${this.typeName}`;
    }
  };
  file.services.push(desc);
  reg.add(desc);
  for (const methodProto of proto.method) {
    const method = newMethod(methodProto, desc, reg);
    desc.methods.push(method);
    desc.method[method.localName] = method;
  }
}
function newMethod(proto, parent, reg) {
  var _a, _b, _c, _d;
  let methodKind;
  if (proto.clientStreaming && proto.serverStreaming) {
    methodKind = "bidi_streaming";
  } else if (proto.clientStreaming) {
    methodKind = "client_streaming";
  } else if (proto.serverStreaming) {
    methodKind = "server_streaming";
  } else {
    methodKind = "unary";
  }
  const input = reg.getMessage(trimLeadingDot(proto.inputType));
  const output = reg.getMessage(trimLeadingDot(proto.outputType));
  assert(input, `invalid MethodDescriptorProto: input_type ${proto.inputType} not found`);
  assert(output, `invalid MethodDescriptorProto: output_type ${proto.inputType} not found`);
  const name = proto.name;
  return {
    kind: "rpc",
    proto,
    deprecated: (_b = (_a = proto.options) === null || _a === undefined ? undefined : _a.deprecated) !== null && _b !== undefined ? _b : false,
    parent,
    name,
    localName: safeObjectProperty(name.length ? safeObjectProperty(name[0].toLowerCase() + name.substring(1)) : name),
    methodKind,
    input,
    output,
    idempotency: (_d = (_c = proto.options) === null || _c === undefined ? undefined : _c.idempotencyLevel) !== null && _d !== undefined ? _d : IDEMPOTENCY_UNKNOWN,
    toString() {
      return `rpc ${parent.typeName}.${name}`;
    }
  };
}
function newOneof(proto, parent) {
  return {
    kind: "oneof",
    proto,
    deprecated: false,
    parent,
    fields: [],
    name: proto.name,
    localName: safeObjectProperty(protoCamelCase(proto.name)),
    toString() {
      return `oneof ${parent.typeName}.${this.name}`;
    }
  };
}
function newField(proto, parentOrFile, reg, oneof, mapEntries) {
  var _a, _b, _c;
  const isExtension = mapEntries === undefined;
  const field = {
    kind: "field",
    proto,
    deprecated: (_b = (_a = proto.options) === null || _a === undefined ? undefined : _a.deprecated) !== null && _b !== undefined ? _b : false,
    name: proto.name,
    number: proto.number,
    scalar: undefined,
    message: undefined,
    enum: undefined,
    presence: getFieldPresence(proto, oneof, isExtension, parentOrFile),
    utf8Validation: isUtf8Validated(proto, parentOrFile),
    listKind: undefined,
    mapKind: undefined,
    mapKey: undefined,
    delimitedEncoding: undefined,
    packed: undefined,
    longAsString: false,
    getDefaultValue: undefined
  };
  if (isExtension) {
    const file = parentOrFile.kind == "file" ? parentOrFile : parentOrFile.file;
    const parent = parentOrFile.kind == "file" ? undefined : parentOrFile;
    const typeName = makeTypeName(proto, parent, file);
    field.kind = "extension";
    field.file = file;
    field.parent = parent;
    field.oneof = undefined;
    field.typeName = typeName;
    field.jsonName = `[${typeName}]`;
    field.toString = () => `extension ${typeName}`;
    const extendee = reg.getMessage(trimLeadingDot(proto.extendee));
    assert(extendee, `invalid FieldDescriptorProto: extendee ${proto.extendee} not found`);
    field.extendee = extendee;
  } else {
    const parent = parentOrFile;
    assert(parent.kind == "message");
    field.parent = parent;
    field.oneof = oneof;
    field.localName = oneof ? protoCamelCase(proto.name) : safeObjectProperty(protoCamelCase(proto.name));
    field.jsonName = proto.jsonName;
    field.toString = () => `field ${parent.typeName}.${proto.name}`;
  }
  const label = proto.label;
  const type = proto.type;
  const jstype = (_c = proto.options) === null || _c === undefined ? undefined : _c.jstype;
  if (label === LABEL_REPEATED) {
    const mapEntry = type == TYPE_MESSAGE ? mapEntries === null || mapEntries === undefined ? undefined : mapEntries.get(trimLeadingDot(proto.typeName)) : undefined;
    if (mapEntry) {
      field.fieldKind = "map";
      const { key, value } = findMapEntryFields(mapEntry);
      field.mapKey = key.scalar;
      field.mapKind = value.fieldKind;
      field.message = value.message;
      field.delimitedEncoding = false;
      field.enum = value.enum;
      field.scalar = value.scalar;
      return field;
    }
    field.fieldKind = "list";
    switch (type) {
      case TYPE_MESSAGE:
      case TYPE_GROUP:
        field.listKind = "message";
        field.message = reg.getMessage(trimLeadingDot(proto.typeName));
        assert(field.message);
        field.delimitedEncoding = isDelimitedEncoding(proto, parentOrFile);
        break;
      case TYPE_ENUM:
        field.listKind = "enum";
        field.enum = reg.getEnum(trimLeadingDot(proto.typeName));
        assert(field.enum);
        break;
      default:
        field.listKind = "scalar";
        field.scalar = type;
        field.longAsString = jstype == JS_STRING;
        break;
    }
    field.packed = isPackedField(proto, parentOrFile);
    return field;
  }
  switch (type) {
    case TYPE_MESSAGE:
    case TYPE_GROUP:
      field.fieldKind = "message";
      field.message = reg.getMessage(trimLeadingDot(proto.typeName));
      assert(field.message, `invalid FieldDescriptorProto: type_name ${proto.typeName} not found`);
      field.delimitedEncoding = isDelimitedEncoding(proto, parentOrFile);
      field.getDefaultValue = () => {
        return;
      };
      break;
    case TYPE_ENUM: {
      const enumeration = reg.getEnum(trimLeadingDot(proto.typeName));
      assert(enumeration !== undefined, `invalid FieldDescriptorProto: type_name ${proto.typeName} not found`);
      field.fieldKind = "enum";
      field.enum = reg.getEnum(trimLeadingDot(proto.typeName));
      field.getDefaultValue = () => {
        return unsafeIsSetExplicit(proto, "defaultValue") ? parseTextFormatEnumValue(enumeration, proto.defaultValue) : undefined;
      };
      break;
    }
    default: {
      field.fieldKind = "scalar";
      field.scalar = type;
      field.longAsString = jstype == JS_STRING;
      field.getDefaultValue = () => {
        return unsafeIsSetExplicit(proto, "defaultValue") ? parseTextFormatScalarValue(type, proto.defaultValue) : undefined;
      };
      break;
    }
  }
  return field;
}
function getFileEdition(proto) {
  switch (proto.syntax) {
    case "":
    case "proto2":
      return EDITION_PROTO2;
    case "proto3":
      return EDITION_PROTO3;
    case "editions":
      if (proto.edition === EDITION_UNSTABLE) {
        return maximumEdition;
      }
      if (proto.edition in featureDefaults) {
        return proto.edition;
      }
      throw new Error(`${proto.name}: unsupported edition`);
    default:
      throw new Error(`${proto.name}: unsupported syntax "${proto.syntax}"`);
  }
}
function findFileDependencies(proto, reg) {
  return proto.dependency.map((wantName) => {
    const dep = reg.getFile(wantName);
    if (!dep) {
      throw new Error(`Cannot find ${wantName}, imported by ${proto.name}`);
    }
    return dep;
  });
}
function findEnumSharedPrefix(enumName, values) {
  const prefix = camelToSnakeCase(enumName) + "_";
  for (const value of values) {
    if (!value.name.toLowerCase().startsWith(prefix)) {
      return;
    }
    const shortName = value.name.substring(prefix.length);
    if (shortName.length == 0) {
      return;
    }
    if (/^\d/.test(shortName)) {
      return;
    }
  }
  return prefix;
}
function camelToSnakeCase(camel) {
  return (camel.substring(0, 1) + camel.substring(1).replace(/[A-Z]/g, (c) => "_" + c)).toLowerCase();
}
function makeTypeName(proto, parent, file) {
  let typeName;
  if (parent) {
    typeName = `${parent.typeName}.${proto.name}`;
  } else if (file.proto.package.length > 0) {
    typeName = `${file.proto.package}.${proto.name}`;
  } else {
    typeName = `${proto.name}`;
  }
  return typeName;
}
function trimLeadingDot(typeName) {
  return typeName.startsWith(".") ? typeName.substring(1) : typeName;
}
function findOneof(proto, allOneofs) {
  if (!unsafeIsSetExplicit(proto, "oneofIndex")) {
    return;
  }
  if (proto.proto3Optional) {
    return;
  }
  const oneof = allOneofs[proto.oneofIndex];
  assert(oneof, `invalid FieldDescriptorProto: oneof #${proto.oneofIndex} for field #${proto.number} not found`);
  return oneof;
}
function getFieldPresence(proto, oneof, isExtension, parent) {
  if (proto.label == LABEL_REQUIRED) {
    return LEGACY_REQUIRED;
  }
  if (proto.label == LABEL_REPEATED) {
    return IMPLICIT2;
  }
  if (!!oneof || proto.proto3Optional) {
    return EXPLICIT;
  }
  if (isExtension) {
    return EXPLICIT;
  }
  const resolved = resolveFeature("fieldPresence", { proto, parent });
  if (resolved == IMPLICIT2 && (proto.type == TYPE_MESSAGE || proto.type == TYPE_GROUP)) {
    return EXPLICIT;
  }
  return resolved;
}
function isPackedField(proto, parent) {
  if (proto.label != LABEL_REPEATED) {
    return false;
  }
  switch (proto.type) {
    case TYPE_STRING:
    case TYPE_BYTES:
    case TYPE_GROUP:
    case TYPE_MESSAGE:
      return false;
  }
  const o = proto.options;
  if (o && unsafeIsSetExplicit(o, "packed")) {
    return o.packed;
  }
  return PACKED == resolveFeature("repeatedFieldEncoding", {
    proto,
    parent
  });
}
function findMapEntryFields(mapEntry) {
  const key = mapEntry.fields.find((f) => f.number === 1);
  const value = mapEntry.fields.find((f) => f.number === 2);
  assert(key && key.fieldKind == "scalar" && key.scalar != ScalarType.BYTES && key.scalar != ScalarType.FLOAT && key.scalar != ScalarType.DOUBLE && value && value.fieldKind != "list" && value.fieldKind != "map");
  return { key, value };
}
function isEnumOpen(desc) {
  var _a;
  return OPEN == resolveFeature("enumType", {
    proto: desc.proto,
    parent: (_a = desc.parent) !== null && _a !== undefined ? _a : desc.file
  });
}
function isDelimitedEncoding(proto, parent) {
  if (proto.type == TYPE_GROUP) {
    return true;
  }
  return DELIMITED == resolveFeature("messageEncoding", {
    proto,
    parent
  });
}
function isUtf8Validated(proto, parent) {
  return VERIFY == resolveFeature("utf8Validation", {
    proto,
    parent
  });
}
function resolveFeature(name, ref) {
  var _a, _b;
  const featureSet = (_a = ref.proto.options) === null || _a === undefined ? undefined : _a.features;
  if (featureSet) {
    const val = featureSet[name];
    if (val != 0) {
      return val;
    }
  }
  if ("kind" in ref) {
    if (ref.kind == "message") {
      return resolveFeature(name, (_b = ref.parent) !== null && _b !== undefined ? _b : ref.file);
    }
    const editionDefaults = featureDefaults[ref.edition];
    if (!editionDefaults) {
      throw new Error(`feature default for edition ${ref.edition} not found`);
    }
    return editionDefaults[name];
  }
  return resolveFeature(name, ref.parent);
}
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/codegenv2/boot.js
function boot(boot2) {
  const root = bootFileDescriptorProto(boot2);
  root.messageType.forEach(restoreJsonNames);
  const reg = createFileRegistry(root, () => {
    return;
  });
  return reg.getFile(root.name);
}
function bootFileDescriptorProto(init) {
  const proto = Object.create({
    syntax: "",
    edition: 0
  });
  return Object.assign(proto, Object.assign(Object.assign({ $typeName: "google.protobuf.FileDescriptorProto", dependency: [], publicDependency: [], weakDependency: [], optionDependency: [], service: [], extension: [] }, init), { messageType: init.messageType.map(bootDescriptorProto), enumType: init.enumType.map(bootEnumDescriptorProto) }));
}
function bootDescriptorProto(init) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const proto = Object.create({
    visibility: 0
  });
  return Object.assign(proto, {
    $typeName: "google.protobuf.DescriptorProto",
    name: init.name,
    field: (_b = (_a = init.field) === null || _a === undefined ? undefined : _a.map(bootFieldDescriptorProto)) !== null && _b !== undefined ? _b : [],
    extension: [],
    nestedType: (_d = (_c = init.nestedType) === null || _c === undefined ? undefined : _c.map(bootDescriptorProto)) !== null && _d !== undefined ? _d : [],
    enumType: (_f = (_e = init.enumType) === null || _e === undefined ? undefined : _e.map(bootEnumDescriptorProto)) !== null && _f !== undefined ? _f : [],
    extensionRange: (_h = (_g = init.extensionRange) === null || _g === undefined ? undefined : _g.map((e) => Object.assign({ $typeName: "google.protobuf.DescriptorProto.ExtensionRange" }, e))) !== null && _h !== undefined ? _h : [],
    oneofDecl: [],
    reservedRange: [],
    reservedName: []
  });
}
function bootFieldDescriptorProto(init) {
  const proto = Object.create({
    label: 1,
    typeName: "",
    extendee: "",
    defaultValue: "",
    oneofIndex: 0,
    jsonName: "",
    proto3Optional: false
  });
  return Object.assign(proto, Object.assign(Object.assign({ $typeName: "google.protobuf.FieldDescriptorProto" }, init), { options: init.options ? bootFieldOptions(init.options) : undefined }));
}
function bootFieldOptions(init) {
  var _a, _b, _c;
  const proto = Object.create({
    ctype: 0,
    packed: false,
    jstype: 0,
    lazy: false,
    unverifiedLazy: false,
    deprecated: false,
    weak: false,
    debugRedact: false,
    retention: 0
  });
  return Object.assign(proto, Object.assign(Object.assign({ $typeName: "google.protobuf.FieldOptions" }, init), { targets: (_a = init.targets) !== null && _a !== undefined ? _a : [], editionDefaults: (_c = (_b = init.editionDefaults) === null || _b === undefined ? undefined : _b.map((e) => Object.assign({ $typeName: "google.protobuf.FieldOptions.EditionDefault" }, e))) !== null && _c !== undefined ? _c : [], uninterpretedOption: [] }));
}
function bootEnumDescriptorProto(init) {
  const proto = Object.create({
    visibility: 0
  });
  return Object.assign(proto, {
    $typeName: "google.protobuf.EnumDescriptorProto",
    name: init.name,
    reservedName: [],
    reservedRange: [],
    value: init.value.map((e) => Object.assign({ $typeName: "google.protobuf.EnumValueDescriptorProto" }, e))
  });
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wire/base64-encoding.js
function base64Decode(base64Str) {
  const table = getDecodeTable();
  let es = base64Str.length * 3 / 4;
  if (base64Str[base64Str.length - 2] == "=")
    es -= 2;
  else if (base64Str[base64Str.length - 1] == "=")
    es -= 1;
  let bytes = new Uint8Array(es), bytePos = 0, groupPos = 0, b, p = 0;
  for (let i = 0;i < base64Str.length; i++) {
    b = table[base64Str.charCodeAt(i)];
    if (b === undefined) {
      switch (base64Str[i]) {
        case "=":
          groupPos = 0;
        case `
`:
        case "\r":
        case "\t":
        case " ":
          continue;
        default:
          throw Error("invalid base64 string");
      }
    }
    switch (groupPos) {
      case 0:
        p = b;
        groupPos = 1;
        break;
      case 1:
        bytes[bytePos++] = p << 2 | (b & 48) >> 4;
        p = b;
        groupPos = 2;
        break;
      case 2:
        bytes[bytePos++] = (p & 15) << 4 | (b & 60) >> 2;
        p = b;
        groupPos = 3;
        break;
      case 3:
        bytes[bytePos++] = (p & 3) << 6 | b;
        groupPos = 0;
        break;
    }
  }
  if (groupPos == 1)
    throw Error("invalid base64 string");
  return bytes.subarray(0, bytePos);
}
function base64Encode(bytes, encoding = "std") {
  const table = getEncodeTable(encoding);
  const pad = encoding == "std";
  let base64 = "", groupPos = 0, b, p = 0;
  for (let i = 0;i < bytes.length; i++) {
    b = bytes[i];
    switch (groupPos) {
      case 0:
        base64 += table[b >> 2];
        p = (b & 3) << 4;
        groupPos = 1;
        break;
      case 1:
        base64 += table[p | b >> 4];
        p = (b & 15) << 2;
        groupPos = 2;
        break;
      case 2:
        base64 += table[p | b >> 6];
        base64 += table[b & 63];
        groupPos = 0;
        break;
    }
  }
  if (groupPos) {
    base64 += table[p];
    if (pad) {
      base64 += "=";
      if (groupPos == 1)
        base64 += "=";
    }
  }
  return base64;
}
var encodeTableStd;
var encodeTableUrl;
var decodeTable;
function getEncodeTable(encoding) {
  if (!encodeTableStd) {
    encodeTableStd = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    encodeTableUrl = encodeTableStd.slice(0, -2).concat("-", "_");
  }
  return encoding == "url" ? encodeTableUrl : encodeTableStd;
}
function getDecodeTable() {
  if (!decodeTable) {
    decodeTable = [];
    const encodeTable = getEncodeTable("std");
    for (let i = 0;i < encodeTable.length; i++)
      decodeTable[encodeTable[i].charCodeAt(0)] = i;
    decodeTable[45] = encodeTable.indexOf("+");
    decodeTable[95] = encodeTable.indexOf("/");
  }
  return decodeTable;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/is-message.js
function isMessage(arg, schema) {
  const isMessage2 = arg !== null && typeof arg == "object" && "$typeName" in arg && typeof arg.$typeName == "string";
  if (!isMessage2) {
    return false;
  }
  if (schema === undefined) {
    return true;
  }
  return schema.typeName === arg.$typeName;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/reflect/error.js
var errorNames = [
  "FieldValueInvalidError",
  "FieldListRangeError",
  "ForeignFieldError"
];

class FieldError extends Error {
  constructor(fieldOrOneof, message, name = "FieldValueInvalidError") {
    super(message);
    this.name = name;
    this.field = () => fieldOrOneof;
  }
}
function isFieldError(arg) {
  return arg instanceof Error && errorNames.includes(arg.name) && "field" in arg && typeof arg.field == "function";
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/reflect/guard.js
function isObject(arg) {
  return arg !== null && typeof arg == "object" && !Array.isArray(arg);
}
function isReflectList(arg, field) {
  var _a, _b, _c, _d;
  if (isObject(arg) && unsafeLocal in arg && "add" in arg && "field" in arg && typeof arg.field == "function") {
    if (field !== undefined) {
      const a = field;
      const b = arg.field();
      return a.listKind == b.listKind && a.scalar === b.scalar && ((_a = a.message) === null || _a === undefined ? undefined : _a.typeName) === ((_b = b.message) === null || _b === undefined ? undefined : _b.typeName) && ((_c = a.enum) === null || _c === undefined ? undefined : _c.typeName) === ((_d = b.enum) === null || _d === undefined ? undefined : _d.typeName);
    }
    return true;
  }
  return false;
}
function isReflectMap(arg, field) {
  var _a, _b, _c, _d;
  if (isObject(arg) && unsafeLocal in arg && "has" in arg && "field" in arg && typeof arg.field == "function") {
    if (field !== undefined) {
      const a = field, b = arg.field();
      return a.mapKey === b.mapKey && a.mapKind == b.mapKind && a.scalar === b.scalar && ((_a = a.message) === null || _a === undefined ? undefined : _a.typeName) === ((_b = b.message) === null || _b === undefined ? undefined : _b.typeName) && ((_c = a.enum) === null || _c === undefined ? undefined : _c.typeName) === ((_d = b.enum) === null || _d === undefined ? undefined : _d.typeName);
    }
    return true;
  }
  return false;
}
function isReflectMessage(arg, messageDesc) {
  return isObject(arg) && unsafeLocal in arg && "desc" in arg && isObject(arg.desc) && arg.desc.kind === "message" && (messageDesc === undefined || arg.desc.typeName == messageDesc.typeName);
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wire/text-encoding.js
var symbol = Symbol.for("@bufbuild/protobuf/text-encoding");
function getTextEncoding() {
  if (globalThis[symbol] == undefined) {
    const te = new globalThis.TextEncoder;
    const td = new globalThis.TextDecoder;
    let tdStrict;
    globalThis[symbol] = {
      encodeUtf8(text) {
        return te.encode(text);
      },
      decodeUtf8(bytes, strict) {
        if (strict) {
          if (tdStrict === undefined) {
            tdStrict = new globalThis.TextDecoder("utf-8", { fatal: true });
          }
          return tdStrict.decode(bytes);
        }
        return td.decode(bytes);
      },
      checkUtf8(text) {
        try {
          encodeURIComponent(text);
          return true;
        } catch (_) {
          return false;
        }
      }
    };
  }
  return globalThis[symbol];
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wire/binary-encoding.js
var WireType;
(function(WireType2) {
  WireType2[WireType2["Varint"] = 0] = "Varint";
  WireType2[WireType2["Bit64"] = 1] = "Bit64";
  WireType2[WireType2["LengthDelimited"] = 2] = "LengthDelimited";
  WireType2[WireType2["StartGroup"] = 3] = "StartGroup";
  WireType2[WireType2["EndGroup"] = 4] = "EndGroup";
  WireType2[WireType2["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));
var FLOAT32_MAX = 340282346638528860000000000000000000000;
var FLOAT32_MIN = -340282346638528860000000000000000000000;
var UINT32_MAX = 4294967295;
var INT32_MAX = 2147483647;
var INT32_MIN = -2147483648;

class BinaryWriter {
  constructor(encodeUtf8 = getTextEncoding().encodeUtf8) {
    this.encodeUtf8 = encodeUtf8;
    this.stack = [];
    this.chunks = [];
    this.buf = [];
  }
  finish() {
    if (this.buf.length) {
      this.chunks.push(new Uint8Array(this.buf));
      this.buf = [];
    }
    let len = 0;
    for (let i = 0;i < this.chunks.length; i++)
      len += this.chunks[i].length;
    let bytes = new Uint8Array(len);
    let offset = 0;
    for (let i = 0;i < this.chunks.length; i++) {
      bytes.set(this.chunks[i], offset);
      offset += this.chunks[i].length;
    }
    this.chunks = [];
    return bytes;
  }
  fork() {
    this.stack.push({ chunks: this.chunks, buf: this.buf });
    this.chunks = [];
    this.buf = [];
    return this;
  }
  join() {
    let chunk = this.finish();
    let prev = this.stack.pop();
    if (!prev)
      throw new Error("invalid state, fork stack empty");
    this.chunks = prev.chunks;
    this.buf = prev.buf;
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  tag(fieldNo, type) {
    return this.uint32((fieldNo << 3 | type) >>> 0);
  }
  raw(chunk) {
    if (this.buf.length) {
      this.chunks.push(new Uint8Array(this.buf));
      this.buf = [];
    }
    this.chunks.push(chunk);
    return this;
  }
  uint32(value) {
    assertUInt32(value);
    while (value > 127) {
      this.buf.push(value & 127 | 128);
      value = value >>> 7;
    }
    this.buf.push(value);
    return this;
  }
  int32(value) {
    assertInt32(value);
    varint32write(value, this.buf);
    return this;
  }
  bool(value) {
    this.buf.push(value ? 1 : 0);
    return this;
  }
  bytes(value) {
    this.uint32(value.byteLength);
    return this.raw(value);
  }
  string(value) {
    let chunk = this.encodeUtf8(value);
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  float(value) {
    assertFloat32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setFloat32(0, value, true);
    return this.raw(chunk);
  }
  double(value) {
    let chunk = new Uint8Array(8);
    new DataView(chunk.buffer).setFloat64(0, value, true);
    return this.raw(chunk);
  }
  fixed32(value) {
    assertUInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setUint32(0, value, true);
    return this.raw(chunk);
  }
  sfixed32(value) {
    assertInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setInt32(0, value, true);
    return this.raw(chunk);
  }
  sint32(value) {
    assertInt32(value);
    value = (value << 1 ^ value >> 31) >>> 0;
    varint32write(value, this.buf);
    return this;
  }
  sfixed64(value) {
    let chunk = new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.enc(value);
    view.setInt32(0, tc.lo, true);
    view.setInt32(4, tc.hi, true);
    return this.raw(chunk);
  }
  fixed64(value) {
    let chunk = new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.uEnc(value);
    view.setInt32(0, tc.lo, true);
    view.setInt32(4, tc.hi, true);
    return this.raw(chunk);
  }
  int64(value) {
    let tc = protoInt64.enc(value);
    varint64write(tc.lo, tc.hi, this.buf);
    return this;
  }
  sint64(value) {
    const tc = protoInt64.enc(value), sign = tc.hi >> 31, lo = tc.lo << 1 ^ sign, hi = (tc.hi << 1 | tc.lo >>> 31) ^ sign;
    varint64write(lo, hi, this.buf);
    return this;
  }
  uint64(value) {
    const tc = protoInt64.uEnc(value);
    varint64write(tc.lo, tc.hi, this.buf);
    return this;
  }
}

class BinaryReader {
  constructor(buf, decodeUtf8 = getTextEncoding().decodeUtf8) {
    this.decodeUtf8 = decodeUtf8;
    this.varint64 = varint64read;
    this.uint32 = varint32read;
    this.buf = buf;
    this.len = buf.length;
    this.pos = 0;
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  tag() {
    const start = this.pos;
    const tag = this.uint32();
    const bytesRead = this.pos - start;
    if (bytesRead > 5 || bytesRead == 5 && this.buf[this.pos - 1] > 15) {
      throw new Error("illegal tag: varint overflows uint32");
    }
    const fieldNo = tag >>> 3;
    const wireType = tag & 7;
    if (fieldNo <= 0 || wireType > 5) {
      throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
    }
    return [fieldNo, wireType];
  }
  skip(wireType, fieldNo) {
    let start = this.pos;
    switch (wireType) {
      case WireType.Varint:
        while (this.buf[this.pos++] & 128) {}
        break;
      case WireType.Bit64:
        this.pos += 4;
      case WireType.Bit32:
        this.pos += 4;
        break;
      case WireType.LengthDelimited:
        let len = this.uint32();
        this.pos += len;
        break;
      case WireType.StartGroup:
        for (;; ) {
          const [fn, wt] = this.tag();
          if (wt === WireType.EndGroup) {
            if (fieldNo !== undefined && fn !== fieldNo) {
              throw new Error("invalid end group tag");
            }
            break;
          }
          this.skip(wt, fn);
        }
        break;
      default:
        throw new Error("cant skip wire type " + wireType);
    }
    this.assertBounds();
    return this.buf.subarray(start, this.pos);
  }
  assertBounds() {
    if (this.pos > this.len)
      throw new RangeError("premature EOF");
  }
  int32() {
    return this.uint32() | 0;
  }
  sint32() {
    let zze = this.uint32();
    return zze >>> 1 ^ -(zze & 1);
  }
  int64() {
    return protoInt64.dec(...this.varint64());
  }
  uint64() {
    return protoInt64.uDec(...this.varint64());
  }
  sint64() {
    let [lo, hi] = this.varint64();
    let s = -(lo & 1);
    lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
    hi = hi >>> 1 ^ s;
    return protoInt64.dec(lo, hi);
  }
  bool() {
    let [lo, hi] = this.varint64();
    return lo !== 0 || hi !== 0;
  }
  fixed32() {
    return this.view.getUint32((this.pos += 4) - 4, true);
  }
  sfixed32() {
    return this.view.getInt32((this.pos += 4) - 4, true);
  }
  fixed64() {
    return protoInt64.uDec(this.sfixed32(), this.sfixed32());
  }
  sfixed64() {
    return protoInt64.dec(this.sfixed32(), this.sfixed32());
  }
  float() {
    return this.view.getFloat32((this.pos += 4) - 4, true);
  }
  double() {
    return this.view.getFloat64((this.pos += 8) - 8, true);
  }
  bytes() {
    let len = this.uint32(), start = this.pos;
    this.pos += len;
    this.assertBounds();
    return this.buf.subarray(start, start + len);
  }
  string(strict) {
    return this.decodeUtf8(this.bytes(), strict);
  }
}
function assertInt32(arg) {
  if (typeof arg == "string") {
    arg = Number(arg);
  } else if (typeof arg != "number") {
    throw new Error("invalid int32: " + typeof arg);
  }
  if (!Number.isInteger(arg) || arg > INT32_MAX || arg < INT32_MIN)
    throw new Error("invalid int32: " + arg);
}
function assertUInt32(arg) {
  if (typeof arg == "string") {
    arg = Number(arg);
  } else if (typeof arg != "number") {
    throw new Error("invalid uint32: " + typeof arg);
  }
  if (!Number.isInteger(arg) || arg > UINT32_MAX || arg < 0)
    throw new Error("invalid uint32: " + arg);
}
function assertFloat32(arg) {
  if (typeof arg == "string") {
    const o = arg;
    arg = Number(arg);
    if (Number.isNaN(arg) && o !== "NaN") {
      throw new Error("invalid float32: " + o);
    }
  } else if (typeof arg != "number") {
    throw new Error("invalid float32: " + typeof arg);
  }
  if (Number.isFinite(arg) && (arg > FLOAT32_MAX || arg < FLOAT32_MIN))
    throw new Error("invalid float32: " + arg);
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/reflect/reflect-check.js
function checkField(field, value) {
  const check = field.fieldKind == "list" ? isReflectList(value, field) : field.fieldKind == "map" ? isReflectMap(value, field) : checkSingular(field, value);
  if (check === true) {
    return;
  }
  let reason;
  switch (field.fieldKind) {
    case "list":
      reason = `expected ${formatReflectList(field)}, got ${formatVal(value)}`;
      break;
    case "map":
      reason = `expected ${formatReflectMap(field)}, got ${formatVal(value)}`;
      break;
    default: {
      reason = reasonSingular(field, value, check);
    }
  }
  return new FieldError(field, reason);
}
function checkListItem(field, index, value) {
  const check = checkSingular(field, value);
  if (check !== true) {
    return new FieldError(field, `list item #${index + 1}: ${reasonSingular(field, value, check)}`);
  }
  return;
}
function checkMapEntry(field, key, value) {
  const checkKey = checkScalarValue(key, field.mapKey);
  if (checkKey !== true) {
    return new FieldError(field, `invalid map key: ${reasonSingular({ scalar: field.mapKey }, key, checkKey)}`);
  }
  const checkVal = checkSingular(field, value);
  if (checkVal !== true) {
    return new FieldError(field, `map entry ${formatVal(key)}: ${reasonSingular(field, value, checkVal)}`);
  }
  return;
}
function checkSingular(field, value) {
  if (field.scalar !== undefined) {
    return checkScalarValue(value, field.scalar);
  }
  if (field.enum !== undefined) {
    if (field.enum.open) {
      return Number.isInteger(value);
    }
    return field.enum.values.some((v) => v.number === value);
  }
  return isReflectMessage(value, field.message);
}
function checkScalarValue(value, scalar) {
  switch (scalar) {
    case ScalarType.DOUBLE:
      return typeof value == "number";
    case ScalarType.FLOAT:
      if (typeof value != "number") {
        return false;
      }
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        return true;
      }
      if (value > FLOAT32_MAX || value < FLOAT32_MIN) {
        return `${value.toFixed()} out of range`;
      }
      return true;
    case ScalarType.INT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return false;
      }
      if (value > INT32_MAX || value < INT32_MIN) {
        return `${value.toFixed()} out of range`;
      }
      return true;
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return false;
      }
      if (value > UINT32_MAX || value < 0) {
        return `${value.toFixed()} out of range`;
      }
      return true;
    case ScalarType.BOOL:
      return typeof value == "boolean";
    case ScalarType.STRING:
      if (typeof value != "string") {
        return false;
      }
      return getTextEncoding().checkUtf8(value) || "invalid UTF8";
    case ScalarType.BYTES:
      return value instanceof Uint8Array;
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      if (typeof value == "bigint" || typeof value == "number" || typeof value == "string" && value.length > 0) {
        try {
          protoInt64.parse(value);
          return true;
        } catch (_) {
          return `${value} out of range`;
        }
      }
      return false;
    case ScalarType.FIXED64:
    case ScalarType.UINT64:
      if (typeof value == "bigint" || typeof value == "number" || typeof value == "string" && value.length > 0) {
        try {
          protoInt64.uParse(value);
          return true;
        } catch (_) {
          return `${value} out of range`;
        }
      }
      return false;
  }
}
function reasonSingular(field, val, details) {
  details = typeof details == "string" ? `: ${details}` : `, got ${formatVal(val)}`;
  if (field.scalar !== undefined) {
    return `expected ${scalarTypeDescription(field.scalar)}` + details;
  }
  if (field.enum !== undefined) {
    return `expected ${field.enum.toString()}` + details;
  }
  return `expected ${formatReflectMessage(field.message)}` + details;
}
function formatVal(val) {
  switch (typeof val) {
    case "object":
      if (val === null) {
        return "null";
      }
      if (val instanceof Uint8Array) {
        return `Uint8Array(${val.length})`;
      }
      if (Array.isArray(val)) {
        return `Array(${val.length})`;
      }
      if (isReflectList(val)) {
        return formatReflectList(val.field());
      }
      if (isReflectMap(val)) {
        return formatReflectMap(val.field());
      }
      if (isReflectMessage(val)) {
        return formatReflectMessage(val.desc);
      }
      if (isMessage(val)) {
        return `message ${val.$typeName}`;
      }
      return "object";
    case "string":
      return val.length > 30 ? "string" : `"${val.split('"').join("\\\"")}"`;
    case "boolean":
      return String(val);
    case "number":
      return String(val);
    case "bigint":
      return String(val) + "n";
    default:
      return typeof val;
  }
}
function formatReflectMessage(desc) {
  return `ReflectMessage (${desc.typeName})`;
}
function formatReflectList(field) {
  switch (field.listKind) {
    case "message":
      return `ReflectList (${field.message.toString()})`;
    case "enum":
      return `ReflectList (${field.enum.toString()})`;
    case "scalar":
      return `ReflectList (${ScalarType[field.scalar]})`;
  }
}
function formatReflectMap(field) {
  switch (field.mapKind) {
    case "message":
      return `ReflectMap (${ScalarType[field.mapKey]}, ${field.message.toString()})`;
    case "enum":
      return `ReflectMap (${ScalarType[field.mapKey]}, ${field.enum.toString()})`;
    case "scalar":
      return `ReflectMap (${ScalarType[field.mapKey]}, ${ScalarType[field.scalar]})`;
  }
}
function scalarTypeDescription(scalar) {
  switch (scalar) {
    case ScalarType.STRING:
      return "string";
    case ScalarType.BOOL:
      return "boolean";
    case ScalarType.INT64:
    case ScalarType.SINT64:
    case ScalarType.SFIXED64:
      return "bigint (int64)";
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
      return "bigint (uint64)";
    case ScalarType.BYTES:
      return "Uint8Array";
    case ScalarType.DOUBLE:
      return "number (float64)";
    case ScalarType.FLOAT:
      return "number (float32)";
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
      return "number (uint32)";
    case ScalarType.INT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
      return "number (int32)";
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wkt/wrappers.js
function isWrapper(arg) {
  return isWrapperTypeName(arg.$typeName);
}
function isWrapperDesc(messageDesc) {
  const f = messageDesc.fields[0];
  return isWrapperTypeName(messageDesc.typeName) && f !== undefined && f.fieldKind == "scalar" && f.name == "value" && f.number == 1;
}
function hasCustomJsonRepresentation(desc) {
  switch (desc.typeName) {
    case "google.protobuf.Any":
    case "google.protobuf.Timestamp":
    case "google.protobuf.Duration":
    case "google.protobuf.FieldMask":
    case "google.protobuf.Struct":
    case "google.protobuf.Value":
    case "google.protobuf.ListValue":
      return true;
    default:
      return isWrapperDesc(desc);
  }
}
function isWrapperTypeName(name) {
  return name.startsWith("google.protobuf.") && [
    "DoubleValue",
    "FloatValue",
    "Int64Value",
    "UInt64Value",
    "Int32Value",
    "UInt32Value",
    "BoolValue",
    "StringValue",
    "BytesValue"
  ].includes(name.substring(16));
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/create.js
var EDITION_PROTO32 = 999;
var EDITION_PROTO22 = 998;
var IMPLICIT3 = 2;
function create(schema, init) {
  if (isMessage(init, schema)) {
    return init;
  }
  const message = createZeroMessage(schema);
  if (init !== undefined) {
    initMessage(schema, message, init);
  }
  return message;
}
function initMessage(messageDesc, message, init) {
  for (const member of messageDesc.members) {
    let value = init[member.localName];
    if (value == null) {
      continue;
    }
    let field;
    if (member.kind == "oneof") {
      const oneofField = unsafeOneofCase(init, member);
      if (!oneofField) {
        continue;
      }
      field = oneofField;
      value = unsafeGet(init, oneofField);
    } else {
      field = member;
    }
    switch (field.fieldKind) {
      case "message":
        value = toMessage(field, value);
        break;
      case "scalar":
        value = initScalar(field, value);
        break;
      case "list":
        value = initList(field, value);
        break;
      case "map":
        value = initMap(field, value);
        break;
    }
    unsafeSet(message, field, value);
  }
  return message;
}
function initScalar(field, value) {
  if (field.scalar == ScalarType.BYTES) {
    return toU8Arr(value);
  }
  return value;
}
function initMap(field, value) {
  if (isObject(value)) {
    if (field.scalar == ScalarType.BYTES) {
      return convertObjectValues(value, toU8Arr);
    }
    if (field.mapKind == "message") {
      return convertObjectValues(value, (val) => toMessage(field, val));
    }
  }
  return value;
}
function initList(field, value) {
  if (Array.isArray(value)) {
    if (field.scalar == ScalarType.BYTES) {
      return value.map(toU8Arr);
    }
    if (field.listKind == "message") {
      return value.map((item) => toMessage(field, item));
    }
  }
  return value;
}
function toMessage(field, value) {
  if (field.fieldKind == "message" && !field.oneof && isWrapperDesc(field.message)) {
    return initScalar(field.message.fields[0], value);
  }
  if (isObject(value)) {
    if (field.message.typeName == "google.protobuf.Struct" && field.parent.typeName !== "google.protobuf.Value") {
      return value;
    }
    if (!isMessage(value, field.message)) {
      return create(field.message, value);
    }
  }
  return value;
}
function toU8Arr(value) {
  return Array.isArray(value) ? new Uint8Array(value) : value;
}
function convertObjectValues(obj, fn) {
  const ret = {};
  for (const entry of Object.entries(obj)) {
    ret[entry[0]] = fn(entry[1]);
  }
  return ret;
}
var tokenZeroMessageField = Symbol();
var messagePrototypes = new WeakMap;
function createZeroMessage(desc) {
  let msg;
  if (!needsPrototypeChain(desc)) {
    msg = {
      $typeName: desc.typeName
    };
    for (const member of desc.members) {
      if (member.kind == "oneof" || member.presence == IMPLICIT3) {
        msg[member.localName] = createZeroField(member);
      }
    }
  } else {
    const cached = messagePrototypes.get(desc);
    let prototype;
    let members;
    if (cached) {
      ({ prototype, members } = cached);
    } else {
      prototype = {};
      members = new Set;
      for (const member of desc.members) {
        if (member.kind == "oneof") {
          continue;
        }
        if (member.fieldKind != "scalar" && member.fieldKind != "enum") {
          continue;
        }
        if (member.presence == IMPLICIT3) {
          continue;
        }
        members.add(member);
        prototype[member.localName] = createZeroField(member);
      }
      messagePrototypes.set(desc, { prototype, members });
    }
    msg = Object.create(prototype);
    msg.$typeName = desc.typeName;
    for (const member of desc.members) {
      if (members.has(member)) {
        continue;
      }
      if (member.kind == "field") {
        if (member.fieldKind == "message") {
          continue;
        }
        if (member.fieldKind == "scalar" || member.fieldKind == "enum") {
          if (member.presence != IMPLICIT3) {
            continue;
          }
        }
      }
      msg[member.localName] = createZeroField(member);
    }
  }
  return msg;
}
function needsPrototypeChain(desc) {
  switch (desc.file.edition) {
    case EDITION_PROTO32:
      return false;
    case EDITION_PROTO22:
      return true;
    default:
      return desc.fields.some((f) => f.presence != IMPLICIT3 && f.fieldKind != "message" && !f.oneof);
  }
}
function createZeroField(field) {
  if (field.kind == "oneof") {
    return { case: undefined };
  }
  if (field.fieldKind == "list") {
    return [];
  }
  if (field.fieldKind == "map") {
    return {};
  }
  if (field.fieldKind == "message") {
    return tokenZeroMessageField;
  }
  const defaultValue = field.getDefaultValue();
  if (defaultValue !== undefined) {
    return field.fieldKind == "scalar" && field.longAsString ? defaultValue.toString() : defaultValue;
  }
  return field.fieldKind == "scalar" ? scalarZeroValue(field.scalar, field.longAsString) : field.enum.values[0].number;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/reflect/reflect.js
function reflect(messageDesc, message, check = true) {
  return new ReflectMessageImpl(messageDesc, message, check);
}
var messageSortedFields = new WeakMap;

class ReflectMessageImpl {
  get sortedFields() {
    const cached = messageSortedFields.get(this.desc);
    if (cached) {
      return cached;
    }
    const sortedFields = this.desc.fields.concat().sort((a, b) => a.number - b.number);
    messageSortedFields.set(this.desc, sortedFields);
    return sortedFields;
  }
  constructor(messageDesc, message, check = true) {
    this.lists = new Map;
    this.maps = new Map;
    this.check = check;
    this.desc = messageDesc;
    this.message = this[unsafeLocal] = message !== null && message !== undefined ? message : create(messageDesc);
    this.fields = messageDesc.fields;
    this.oneofs = messageDesc.oneofs;
    this.members = messageDesc.members;
  }
  findNumber(number) {
    if (!this._fieldsByNumber) {
      this._fieldsByNumber = new Map(this.desc.fields.map((f) => [f.number, f]));
    }
    return this._fieldsByNumber.get(number);
  }
  oneofCase(oneof) {
    assertOwn(this.message, oneof);
    return unsafeOneofCase(this.message, oneof);
  }
  isSet(field) {
    assertOwn(this.message, field);
    return unsafeIsSet(this.message, field);
  }
  clear(field) {
    assertOwn(this.message, field);
    unsafeClear(this.message, field);
  }
  get(field) {
    assertOwn(this.message, field);
    const value = unsafeGet(this.message, field);
    switch (field.fieldKind) {
      case "list":
        let list = this.lists.get(field);
        if (!list || list[unsafeLocal] !== value) {
          this.lists.set(field, list = new ReflectListImpl(field, value, this.check));
        }
        return list;
      case "map":
        let map = this.maps.get(field);
        if (!map || map[unsafeLocal] !== value) {
          this.maps.set(field, map = new ReflectMapImpl(field, value, this.check));
        }
        return map;
      case "message":
        return messageToReflect(field, value, this.check);
      case "scalar":
        return value === undefined ? scalarZeroValue(field.scalar, false) : longToReflect(field, value);
      case "enum":
        return value !== null && value !== undefined ? value : field.enum.values[0].number;
    }
  }
  set(field, value) {
    assertOwn(this.message, field);
    if (this.check) {
      const err = checkField(field, value);
      if (err) {
        throw err;
      }
    }
    let local;
    if (field.fieldKind == "message") {
      local = messageToLocal(field, value);
    } else if (isReflectMap(value) || isReflectList(value)) {
      local = value[unsafeLocal];
    } else {
      local = longToLocal(field, value);
    }
    unsafeSet(this.message, field, local);
  }
  getUnknown() {
    return this.message.$unknown;
  }
  setUnknown(value) {
    this.message.$unknown = value;
  }
}
function assertOwn(owner, member) {
  if (member.parent.typeName !== owner.$typeName) {
    throw new FieldError(member, `cannot use ${member.toString()} with message ${owner.$typeName}`, "ForeignFieldError");
  }
}
class ReflectListImpl {
  field() {
    return this._field;
  }
  get size() {
    return this._arr.length;
  }
  constructor(field, unsafeInput, check) {
    this._field = field;
    this._arr = this[unsafeLocal] = unsafeInput;
    this.check = check;
  }
  get(index) {
    const item = this._arr[index];
    return item === undefined ? undefined : listItemToReflect(this._field, item, this.check);
  }
  set(index, item) {
    if (index < 0 || index >= this._arr.length) {
      throw new FieldError(this._field, `list item #${index + 1}: out of range`);
    }
    if (this.check) {
      const err = checkListItem(this._field, index, item);
      if (err) {
        throw err;
      }
    }
    this._arr[index] = listItemToLocal(this._field, item);
  }
  add(item) {
    if (this.check) {
      const err = checkListItem(this._field, this._arr.length, item);
      if (err) {
        throw err;
      }
    }
    this._arr.push(listItemToLocal(this._field, item));
    return;
  }
  clear() {
    this._arr.splice(0, this._arr.length);
  }
  [Symbol.iterator]() {
    return this.values();
  }
  keys() {
    return this._arr.keys();
  }
  *values() {
    for (const item of this._arr) {
      yield listItemToReflect(this._field, item, this.check);
    }
  }
  *entries() {
    for (let i = 0;i < this._arr.length; i++) {
      yield [i, listItemToReflect(this._field, this._arr[i], this.check)];
    }
  }
}
class ReflectMapImpl {
  constructor(field, unsafeInput, check = true) {
    this.obj = this[unsafeLocal] = unsafeInput !== null && unsafeInput !== undefined ? unsafeInput : {};
    this.check = check;
    this._field = field;
  }
  field() {
    return this._field;
  }
  set(key, value) {
    if (this.check) {
      const err = checkMapEntry(this._field, key, value);
      if (err) {
        throw err;
      }
    }
    this.obj[mapKeyToLocal(key)] = mapValueToLocal(this._field, value);
    return this;
  }
  delete(key) {
    const k = mapKeyToLocal(key);
    const has = Object.prototype.hasOwnProperty.call(this.obj, k);
    if (has) {
      delete this.obj[k];
    }
    return has;
  }
  clear() {
    for (const key of Object.keys(this.obj)) {
      delete this.obj[key];
    }
  }
  get(key) {
    let val = this.obj[mapKeyToLocal(key)];
    if (val !== undefined) {
      val = mapValueToReflect(this._field, val, this.check);
    }
    return val;
  }
  has(key) {
    return Object.prototype.hasOwnProperty.call(this.obj, mapKeyToLocal(key));
  }
  *keys() {
    for (const objKey of Object.keys(this.obj)) {
      yield mapKeyToReflect(objKey, this._field.mapKey);
    }
  }
  *entries() {
    for (const objEntry of Object.entries(this.obj)) {
      yield [
        mapKeyToReflect(objEntry[0], this._field.mapKey),
        mapValueToReflect(this._field, objEntry[1], this.check)
      ];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  get size() {
    return Object.keys(this.obj).length;
  }
  *values() {
    for (const val of Object.values(this.obj)) {
      yield mapValueToReflect(this._field, val, this.check);
    }
  }
  forEach(callbackfn, thisArg) {
    for (const mapEntry of this.entries()) {
      callbackfn.call(thisArg, mapEntry[1], mapEntry[0], this);
    }
  }
}
function messageToLocal(field, value) {
  if (!isReflectMessage(value)) {
    return value;
  }
  if (isWrapper(value.message) && !field.oneof && field.fieldKind == "message") {
    return value.message.value;
  }
  if (value.desc.typeName == "google.protobuf.Struct" && field.parent.typeName != "google.protobuf.Value") {
    return wktStructToLocal(value.message);
  }
  return value.message;
}
function messageToReflect(field, value, check) {
  if (value !== undefined) {
    if (isWrapperDesc(field.message) && !field.oneof && field.fieldKind == "message") {
      value = {
        $typeName: field.message.typeName,
        value: longToReflect(field.message.fields[0], value)
      };
    } else if (field.message.typeName == "google.protobuf.Struct" && field.parent.typeName != "google.protobuf.Value" && isObject(value)) {
      value = wktStructToReflect(value);
    }
  }
  return new ReflectMessageImpl(field.message, value, check);
}
function listItemToLocal(field, value) {
  if (field.listKind == "message") {
    return messageToLocal(field, value);
  }
  return longToLocal(field, value);
}
function listItemToReflect(field, value, check) {
  if (field.listKind == "message") {
    return messageToReflect(field, value, check);
  }
  return longToReflect(field, value);
}
function mapValueToLocal(field, value) {
  if (field.mapKind == "message") {
    return messageToLocal(field, value);
  }
  return longToLocal(field, value);
}
function mapValueToReflect(field, value, check) {
  if (field.mapKind == "message") {
    return messageToReflect(field, value, check);
  }
  return value;
}
function mapKeyToLocal(key) {
  return typeof key == "string" || typeof key == "number" ? key : String(key);
}
function mapKeyToReflect(key, type) {
  switch (type) {
    case ScalarType.STRING:
      return key;
    case ScalarType.INT32:
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32: {
      const n = Number.parseInt(key);
      if (Number.isFinite(n)) {
        return n;
      }
      break;
    }
    case ScalarType.BOOL:
      switch (key) {
        case "true":
          return true;
        case "false":
          return false;
      }
      break;
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
      try {
        return protoInt64.uParse(key);
      } catch (_a) {}
      break;
    default:
      try {
        return protoInt64.parse(key);
      } catch (_b) {}
      break;
  }
  return key;
}
function longToReflect(field, value) {
  switch (field.scalar) {
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      if ("longAsString" in field && field.longAsString && typeof value == "string") {
        value = protoInt64.parse(value);
      }
      break;
    case ScalarType.FIXED64:
    case ScalarType.UINT64:
      if ("longAsString" in field && field.longAsString && typeof value == "string") {
        value = protoInt64.uParse(value);
      }
      break;
  }
  return value;
}
function longToLocal(field, value) {
  switch (field.scalar) {
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      if ("longAsString" in field && field.longAsString) {
        value = String(value);
      } else if (typeof value == "string" || typeof value == "number") {
        value = protoInt64.parse(value);
      }
      break;
    case ScalarType.FIXED64:
    case ScalarType.UINT64:
      if ("longAsString" in field && field.longAsString) {
        value = String(value);
      } else if (typeof value == "string" || typeof value == "number") {
        value = protoInt64.uParse(value);
      }
      break;
  }
  return value;
}
function wktStructToReflect(json) {
  const struct = {
    $typeName: "google.protobuf.Struct",
    fields: {}
  };
  if (isObject(json)) {
    for (const [k, v] of Object.entries(json)) {
      struct.fields[k] = wktValueToReflect(v);
    }
  }
  return struct;
}
function wktStructToLocal(val) {
  const json = {};
  for (const [k, v] of Object.entries(val.fields)) {
    json[k] = wktValueToLocal(v);
  }
  return json;
}
function wktValueToLocal(val) {
  switch (val.kind.case) {
    case "structValue":
      return wktStructToLocal(val.kind.value);
    case "listValue":
      return val.kind.value.values.map(wktValueToLocal);
    case "nullValue":
    case undefined:
      return null;
    default:
      return val.kind.value;
  }
}
function wktValueToReflect(json) {
  const value = {
    $typeName: "google.protobuf.Value",
    kind: { case: undefined }
  };
  switch (typeof json) {
    case "number":
      value.kind = { case: "numberValue", value: json };
      break;
    case "string":
      value.kind = { case: "stringValue", value: json };
      break;
    case "boolean":
      value.kind = { case: "boolValue", value: json };
      break;
    case "object":
      if (json === null) {
        const nullValue = 0;
        value.kind = { case: "nullValue", value: nullValue };
      } else if (Array.isArray(json)) {
        const listValue = {
          $typeName: "google.protobuf.ListValue",
          values: []
        };
        if (Array.isArray(json)) {
          for (const e of json) {
            listValue.values.push(wktValueToReflect(e));
          }
        }
        value.kind = {
          case: "listValue",
          value: listValue
        };
      } else {
        value.kind = {
          case: "structValue",
          value: wktStructToReflect(json)
        };
      }
      break;
  }
  return value;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/to-binary.js
var LEGACY_REQUIRED2 = 3;
var writeDefaults = {
  writeUnknownFields: true
};
function makeWriteOptions(options) {
  return options ? Object.assign(Object.assign({}, writeDefaults), options) : writeDefaults;
}
function toBinary(schema, message, options) {
  return writeFields(new BinaryWriter, makeWriteOptions(options), reflect(schema, message)).finish();
}
function writeFields(writer, opts, msg) {
  var _a;
  for (const f of msg.sortedFields) {
    if (!msg.isSet(f)) {
      if (f.presence == LEGACY_REQUIRED2) {
        throw new Error(`cannot encode ${f} to binary: required field not set`);
      }
      continue;
    }
    writeField(writer, opts, msg, f);
  }
  if (opts.writeUnknownFields) {
    for (const { no, wireType, data } of (_a = msg.getUnknown()) !== null && _a !== undefined ? _a : []) {
      writer.tag(no, wireType).raw(data);
    }
  }
  return writer;
}
function writeField(writer, opts, msg, field) {
  var _a;
  switch (field.fieldKind) {
    case "scalar":
    case "enum":
      writeScalar(writer, msg.desc.typeName, field.name, (_a = field.scalar) !== null && _a !== undefined ? _a : ScalarType.INT32, field.number, msg.get(field));
      break;
    case "list":
      writeListField(writer, opts, field, msg.get(field));
      break;
    case "message":
      writeMessageField(writer, opts, field, msg.get(field));
      break;
    case "map":
      for (const [key, val] of msg.get(field)) {
        writeMapEntry(writer, opts, field, key, val);
      }
      break;
  }
}
function writeScalar(writer, msgName, fieldName, scalarType, fieldNo, value) {
  writeScalarValue(writer.tag(fieldNo, writeTypeOfScalar(scalarType)), msgName, fieldName, scalarType, value);
}
function writeMessageField(writer, opts, field, message) {
  if (field.delimitedEncoding) {
    writeFields(writer.tag(field.number, WireType.StartGroup), opts, message).tag(field.number, WireType.EndGroup);
  } else {
    writeFields(writer.tag(field.number, WireType.LengthDelimited).fork(), opts, message).join();
  }
}
function writeListField(writer, opts, field, list) {
  var _a;
  if (field.listKind == "message") {
    for (const item of list) {
      writeMessageField(writer, opts, field, item);
    }
    return;
  }
  const scalarType = (_a = field.scalar) !== null && _a !== undefined ? _a : ScalarType.INT32;
  if (field.packed) {
    if (!list.size) {
      return;
    }
    writer.tag(field.number, WireType.LengthDelimited).fork();
    for (const item of list) {
      writeScalarValue(writer, field.parent.typeName, field.name, scalarType, item);
    }
    writer.join();
    return;
  }
  for (const item of list) {
    writeScalar(writer, field.parent.typeName, field.name, scalarType, field.number, item);
  }
}
function writeMapEntry(writer, opts, field, key, value) {
  var _a;
  writer.tag(field.number, WireType.LengthDelimited).fork();
  writeScalar(writer, field.parent.typeName, field.name, field.mapKey, 1, key);
  switch (field.mapKind) {
    case "scalar":
    case "enum":
      writeScalar(writer, field.parent.typeName, field.name, (_a = field.scalar) !== null && _a !== undefined ? _a : ScalarType.INT32, 2, value);
      break;
    case "message":
      writeFields(writer.tag(2, WireType.LengthDelimited).fork(), opts, value).join();
      break;
  }
  writer.join();
}
function writeScalarValue(writer, msgName, fieldName, type, value) {
  try {
    switch (type) {
      case ScalarType.STRING:
        writer.string(value);
        break;
      case ScalarType.BOOL:
        writer.bool(value);
        break;
      case ScalarType.DOUBLE:
        writer.double(value);
        break;
      case ScalarType.FLOAT:
        writer.float(value);
        break;
      case ScalarType.INT32:
        writer.int32(value);
        break;
      case ScalarType.INT64:
        writer.int64(value);
        break;
      case ScalarType.UINT64:
        writer.uint64(value);
        break;
      case ScalarType.FIXED64:
        writer.fixed64(value);
        break;
      case ScalarType.BYTES:
        writer.bytes(value);
        break;
      case ScalarType.FIXED32:
        writer.fixed32(value);
        break;
      case ScalarType.SFIXED32:
        writer.sfixed32(value);
        break;
      case ScalarType.SFIXED64:
        writer.sfixed64(value);
        break;
      case ScalarType.SINT64:
        writer.sint64(value);
        break;
      case ScalarType.UINT32:
        writer.uint32(value);
        break;
      case ScalarType.SINT32:
        writer.sint32(value);
        break;
    }
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`cannot encode field ${msgName}.${fieldName} to binary: ${e.message}`);
    }
    throw e;
  }
}
function writeTypeOfScalar(type) {
  switch (type) {
    case ScalarType.BYTES:
    case ScalarType.STRING:
      return WireType.LengthDelimited;
    case ScalarType.DOUBLE:
    case ScalarType.FIXED64:
    case ScalarType.SFIXED64:
      return WireType.Bit64;
    case ScalarType.FIXED32:
    case ScalarType.SFIXED32:
    case ScalarType.FLOAT:
      return WireType.Bit32;
    default:
      return WireType.Varint;
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/clone.js
function clone(schema, message) {
  return cloneReflect(reflect(schema, message)).message;
}
function cloneReflect(i) {
  const o = reflect(i.desc);
  for (const f of i.fields) {
    if (!i.isSet(f)) {
      continue;
    }
    switch (f.fieldKind) {
      case "list":
        const list = o.get(f);
        for (const item of i.get(f)) {
          list.add(cloneSingular(f, item));
        }
        break;
      case "map":
        const map = o.get(f);
        for (const entry of i.get(f).entries()) {
          map.set(entry[0], cloneSingular(f, entry[1]));
        }
        break;
      default: {
        o.set(f, cloneSingular(f, i.get(f)));
        break;
      }
    }
  }
  const unknown = i.getUnknown();
  if (unknown && unknown.length > 0) {
    o.setUnknown([...unknown]);
  }
  return o;
}
function cloneSingular(field, value) {
  if (field.message !== undefined && isReflectMessage(value)) {
    return cloneReflect(value);
  }
  if (field.scalar == ScalarType.BYTES && value instanceof Uint8Array) {
    return value.slice();
  }
  return value;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/codegenv2/message.js
function messageDesc(file, path, ...paths) {
  return paths.reduce((acc, cur) => acc.nestedMessages[cur], file.messages[path]);
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wkt/gen/google/protobuf/descriptor_pb.js
var file_google_protobuf_descriptor = /* @__PURE__ */ boot({ name: "google/protobuf/descriptor.proto", package: "google.protobuf", messageType: [{ name: "FileDescriptorSet", field: [{ name: "file", number: 1, type: 11, label: 3, typeName: ".google.protobuf.FileDescriptorProto" }], extensionRange: [{ start: 536000000, end: 536000001 }] }, { name: "FileDescriptorProto", field: [{ name: "name", number: 1, type: 9, label: 1 }, { name: "package", number: 2, type: 9, label: 1 }, { name: "dependency", number: 3, type: 9, label: 3 }, { name: "public_dependency", number: 10, type: 5, label: 3 }, { name: "weak_dependency", number: 11, type: 5, label: 3 }, { name: "option_dependency", number: 15, type: 9, label: 3 }, { name: "message_type", number: 4, type: 11, label: 3, typeName: ".google.protobuf.DescriptorProto" }, { name: "enum_type", number: 5, type: 11, label: 3, typeName: ".google.protobuf.EnumDescriptorProto" }, { name: "service", number: 6, type: 11, label: 3, typeName: ".google.protobuf.ServiceDescriptorProto" }, { name: "extension", number: 7, type: 11, label: 3, typeName: ".google.protobuf.FieldDescriptorProto" }, { name: "options", number: 8, type: 11, label: 1, typeName: ".google.protobuf.FileOptions" }, { name: "source_code_info", number: 9, type: 11, label: 1, typeName: ".google.protobuf.SourceCodeInfo" }, { name: "syntax", number: 12, type: 9, label: 1 }, { name: "edition", number: 14, type: 14, label: 1, typeName: ".google.protobuf.Edition" }] }, { name: "DescriptorProto", field: [{ name: "name", number: 1, type: 9, label: 1 }, { name: "field", number: 2, type: 11, label: 3, typeName: ".google.protobuf.FieldDescriptorProto" }, { name: "extension", number: 6, type: 11, label: 3, typeName: ".google.protobuf.FieldDescriptorProto" }, { name: "nested_type", number: 3, type: 11, label: 3, typeName: ".google.protobuf.DescriptorProto" }, { name: "enum_type", number: 4, type: 11, label: 3, typeName: ".google.protobuf.EnumDescriptorProto" }, { name: "extension_range", number: 5, type: 11, label: 3, typeName: ".google.protobuf.DescriptorProto.ExtensionRange" }, { name: "oneof_decl", number: 8, type: 11, label: 3, typeName: ".google.protobuf.OneofDescriptorProto" }, { name: "options", number: 7, type: 11, label: 1, typeName: ".google.protobuf.MessageOptions" }, { name: "reserved_range", number: 9, type: 11, label: 3, typeName: ".google.protobuf.DescriptorProto.ReservedRange" }, { name: "reserved_name", number: 10, type: 9, label: 3 }, { name: "visibility", number: 11, type: 14, label: 1, typeName: ".google.protobuf.SymbolVisibility" }], nestedType: [{ name: "ExtensionRange", field: [{ name: "start", number: 1, type: 5, label: 1 }, { name: "end", number: 2, type: 5, label: 1 }, { name: "options", number: 3, type: 11, label: 1, typeName: ".google.protobuf.ExtensionRangeOptions" }] }, { name: "ReservedRange", field: [{ name: "start", number: 1, type: 5, label: 1 }, { name: "end", number: 2, type: 5, label: 1 }] }] }, { name: "ExtensionRangeOptions", field: [{ name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }, { name: "declaration", number: 2, type: 11, label: 3, typeName: ".google.protobuf.ExtensionRangeOptions.Declaration", options: { retention: 2 } }, { name: "features", number: 50, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "verification", number: 3, type: 14, label: 1, typeName: ".google.protobuf.ExtensionRangeOptions.VerificationState", defaultValue: "UNVERIFIED", options: { retention: 2 } }], nestedType: [{ name: "Declaration", field: [{ name: "number", number: 1, type: 5, label: 1 }, { name: "full_name", number: 2, type: 9, label: 1 }, { name: "type", number: 3, type: 9, label: 1 }, { name: "reserved", number: 5, type: 8, label: 1 }, { name: "repeated", number: 6, type: 8, label: 1 }] }], enumType: [{ name: "VerificationState", value: [{ name: "DECLARATION", number: 0 }, { name: "UNVERIFIED", number: 1 }] }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "FieldDescriptorProto", field: [{ name: "name", number: 1, type: 9, label: 1 }, { name: "number", number: 3, type: 5, label: 1 }, { name: "label", number: 4, type: 14, label: 1, typeName: ".google.protobuf.FieldDescriptorProto.Label" }, { name: "type", number: 5, type: 14, label: 1, typeName: ".google.protobuf.FieldDescriptorProto.Type" }, { name: "type_name", number: 6, type: 9, label: 1 }, { name: "extendee", number: 2, type: 9, label: 1 }, { name: "default_value", number: 7, type: 9, label: 1 }, { name: "oneof_index", number: 9, type: 5, label: 1 }, { name: "json_name", number: 10, type: 9, label: 1 }, { name: "options", number: 8, type: 11, label: 1, typeName: ".google.protobuf.FieldOptions" }, { name: "proto3_optional", number: 17, type: 8, label: 1 }], enumType: [{ name: "Type", value: [{ name: "TYPE_DOUBLE", number: 1 }, { name: "TYPE_FLOAT", number: 2 }, { name: "TYPE_INT64", number: 3 }, { name: "TYPE_UINT64", number: 4 }, { name: "TYPE_INT32", number: 5 }, { name: "TYPE_FIXED64", number: 6 }, { name: "TYPE_FIXED32", number: 7 }, { name: "TYPE_BOOL", number: 8 }, { name: "TYPE_STRING", number: 9 }, { name: "TYPE_GROUP", number: 10 }, { name: "TYPE_MESSAGE", number: 11 }, { name: "TYPE_BYTES", number: 12 }, { name: "TYPE_UINT32", number: 13 }, { name: "TYPE_ENUM", number: 14 }, { name: "TYPE_SFIXED32", number: 15 }, { name: "TYPE_SFIXED64", number: 16 }, { name: "TYPE_SINT32", number: 17 }, { name: "TYPE_SINT64", number: 18 }] }, { name: "Label", value: [{ name: "LABEL_OPTIONAL", number: 1 }, { name: "LABEL_REPEATED", number: 3 }, { name: "LABEL_REQUIRED", number: 2 }] }] }, { name: "OneofDescriptorProto", field: [{ name: "name", number: 1, type: 9, label: 1 }, { name: "options", number: 2, type: 11, label: 1, typeName: ".google.protobuf.OneofOptions" }] }, { name: "EnumDescriptorProto", field: [{ name: "name", number: 1, type: 9, label: 1 }, { name: "value", number: 2, type: 11, label: 3, typeName: ".google.protobuf.EnumValueDescriptorProto" }, { name: "options", number: 3, type: 11, label: 1, typeName: ".google.protobuf.EnumOptions" }, { name: "reserved_range", number: 4, type: 11, label: 3, typeName: ".google.protobuf.EnumDescriptorProto.EnumReservedRange" }, { name: "reserved_name", number: 5, type: 9, label: 3 }, { name: "visibility", number: 6, type: 14, label: 1, typeName: ".google.protobuf.SymbolVisibility" }], nestedType: [{ name: "EnumReservedRange", field: [{ name: "start", number: 1, type: 5, label: 1 }, { name: "end", number: 2, type: 5, label: 1 }] }] }, { name: "EnumValueDescriptorProto", field: [{ name: "name", number: 1, type: 9, label: 1 }, { name: "number", number: 2, type: 5, label: 1 }, { name: "options", number: 3, type: 11, label: 1, typeName: ".google.protobuf.EnumValueOptions" }] }, { name: "ServiceDescriptorProto", field: [{ name: "name", number: 1, type: 9, label: 1 }, { name: "method", number: 2, type: 11, label: 3, typeName: ".google.protobuf.MethodDescriptorProto" }, { name: "options", number: 3, type: 11, label: 1, typeName: ".google.protobuf.ServiceOptions" }] }, { name: "MethodDescriptorProto", field: [{ name: "name", number: 1, type: 9, label: 1 }, { name: "input_type", number: 2, type: 9, label: 1 }, { name: "output_type", number: 3, type: 9, label: 1 }, { name: "options", number: 4, type: 11, label: 1, typeName: ".google.protobuf.MethodOptions" }, { name: "client_streaming", number: 5, type: 8, label: 1, defaultValue: "false" }, { name: "server_streaming", number: 6, type: 8, label: 1, defaultValue: "false" }] }, { name: "FileOptions", field: [{ name: "java_package", number: 1, type: 9, label: 1 }, { name: "java_outer_classname", number: 8, type: 9, label: 1 }, { name: "java_multiple_files", number: 10, type: 8, label: 1, defaultValue: "false", options: {} }, { name: "java_generate_equals_and_hash", number: 20, type: 8, label: 1, options: { deprecated: true } }, { name: "java_string_check_utf8", number: 27, type: 8, label: 1, defaultValue: "false" }, { name: "optimize_for", number: 9, type: 14, label: 1, typeName: ".google.protobuf.FileOptions.OptimizeMode", defaultValue: "SPEED" }, { name: "go_package", number: 11, type: 9, label: 1 }, { name: "cc_generic_services", number: 16, type: 8, label: 1, defaultValue: "false" }, { name: "java_generic_services", number: 17, type: 8, label: 1, defaultValue: "false" }, { name: "py_generic_services", number: 18, type: 8, label: 1, defaultValue: "false" }, { name: "deprecated", number: 23, type: 8, label: 1, defaultValue: "false" }, { name: "cc_enable_arenas", number: 31, type: 8, label: 1, defaultValue: "true" }, { name: "objc_class_prefix", number: 36, type: 9, label: 1 }, { name: "csharp_namespace", number: 37, type: 9, label: 1 }, { name: "swift_prefix", number: 39, type: 9, label: 1 }, { name: "php_class_prefix", number: 40, type: 9, label: 1 }, { name: "php_namespace", number: 41, type: 9, label: 1 }, { name: "php_metadata_namespace", number: 44, type: 9, label: 1 }, { name: "ruby_package", number: 45, type: 9, label: 1 }, { name: "features", number: 50, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }], enumType: [{ name: "OptimizeMode", value: [{ name: "SPEED", number: 1 }, { name: "CODE_SIZE", number: 2 }, { name: "LITE_RUNTIME", number: 3 }] }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "MessageOptions", field: [{ name: "message_set_wire_format", number: 1, type: 8, label: 1, defaultValue: "false" }, { name: "no_standard_descriptor_accessor", number: 2, type: 8, label: 1, defaultValue: "false" }, { name: "deprecated", number: 3, type: 8, label: 1, defaultValue: "false" }, { name: "map_entry", number: 7, type: 8, label: 1 }, { name: "deprecated_legacy_json_field_conflicts", number: 11, type: 8, label: 1, options: { deprecated: true } }, { name: "features", number: 12, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "FieldOptions", field: [{ name: "ctype", number: 1, type: 14, label: 1, typeName: ".google.protobuf.FieldOptions.CType", defaultValue: "STRING" }, { name: "packed", number: 2, type: 8, label: 1 }, { name: "jstype", number: 6, type: 14, label: 1, typeName: ".google.protobuf.FieldOptions.JSType", defaultValue: "JS_NORMAL" }, { name: "lazy", number: 5, type: 8, label: 1, defaultValue: "false" }, { name: "unverified_lazy", number: 15, type: 8, label: 1, defaultValue: "false" }, { name: "deprecated", number: 3, type: 8, label: 1, defaultValue: "false" }, { name: "weak", number: 10, type: 8, label: 1, defaultValue: "false", options: { deprecated: true } }, { name: "debug_redact", number: 16, type: 8, label: 1, defaultValue: "false" }, { name: "retention", number: 17, type: 14, label: 1, typeName: ".google.protobuf.FieldOptions.OptionRetention" }, { name: "targets", number: 19, type: 14, label: 3, typeName: ".google.protobuf.FieldOptions.OptionTargetType" }, { name: "edition_defaults", number: 20, type: 11, label: 3, typeName: ".google.protobuf.FieldOptions.EditionDefault" }, { name: "features", number: 21, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "feature_support", number: 22, type: 11, label: 1, typeName: ".google.protobuf.FieldOptions.FeatureSupport" }, { name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }], nestedType: [{ name: "EditionDefault", field: [{ name: "edition", number: 3, type: 14, label: 1, typeName: ".google.protobuf.Edition" }, { name: "value", number: 2, type: 9, label: 1 }] }, { name: "FeatureSupport", field: [{ name: "edition_introduced", number: 1, type: 14, label: 1, typeName: ".google.protobuf.Edition" }, { name: "edition_deprecated", number: 2, type: 14, label: 1, typeName: ".google.protobuf.Edition" }, { name: "deprecation_warning", number: 3, type: 9, label: 1 }, { name: "edition_removed", number: 4, type: 14, label: 1, typeName: ".google.protobuf.Edition" }, { name: "removal_error", number: 5, type: 9, label: 1 }] }], enumType: [{ name: "CType", value: [{ name: "STRING", number: 0 }, { name: "CORD", number: 1 }, { name: "STRING_PIECE", number: 2 }] }, { name: "JSType", value: [{ name: "JS_NORMAL", number: 0 }, { name: "JS_STRING", number: 1 }, { name: "JS_NUMBER", number: 2 }] }, { name: "OptionRetention", value: [{ name: "RETENTION_UNKNOWN", number: 0 }, { name: "RETENTION_RUNTIME", number: 1 }, { name: "RETENTION_SOURCE", number: 2 }] }, { name: "OptionTargetType", value: [{ name: "TARGET_TYPE_UNKNOWN", number: 0 }, { name: "TARGET_TYPE_FILE", number: 1 }, { name: "TARGET_TYPE_EXTENSION_RANGE", number: 2 }, { name: "TARGET_TYPE_MESSAGE", number: 3 }, { name: "TARGET_TYPE_FIELD", number: 4 }, { name: "TARGET_TYPE_ONEOF", number: 5 }, { name: "TARGET_TYPE_ENUM", number: 6 }, { name: "TARGET_TYPE_ENUM_ENTRY", number: 7 }, { name: "TARGET_TYPE_SERVICE", number: 8 }, { name: "TARGET_TYPE_METHOD", number: 9 }] }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "OneofOptions", field: [{ name: "features", number: 1, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "EnumOptions", field: [{ name: "allow_alias", number: 2, type: 8, label: 1 }, { name: "deprecated", number: 3, type: 8, label: 1, defaultValue: "false" }, { name: "deprecated_legacy_json_field_conflicts", number: 6, type: 8, label: 1, options: { deprecated: true } }, { name: "features", number: 7, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "EnumValueOptions", field: [{ name: "deprecated", number: 1, type: 8, label: 1, defaultValue: "false" }, { name: "features", number: 2, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "debug_redact", number: 3, type: 8, label: 1, defaultValue: "false" }, { name: "feature_support", number: 4, type: 11, label: 1, typeName: ".google.protobuf.FieldOptions.FeatureSupport" }, { name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "ServiceOptions", field: [{ name: "features", number: 34, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "deprecated", number: 33, type: 8, label: 1, defaultValue: "false" }, { name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "MethodOptions", field: [{ name: "deprecated", number: 33, type: 8, label: 1, defaultValue: "false" }, { name: "idempotency_level", number: 34, type: 14, label: 1, typeName: ".google.protobuf.MethodOptions.IdempotencyLevel", defaultValue: "IDEMPOTENCY_UNKNOWN" }, { name: "features", number: 35, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "uninterpreted_option", number: 999, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption" }], enumType: [{ name: "IdempotencyLevel", value: [{ name: "IDEMPOTENCY_UNKNOWN", number: 0 }, { name: "NO_SIDE_EFFECTS", number: 1 }, { name: "IDEMPOTENT", number: 2 }] }], extensionRange: [{ start: 1000, end: 536870912 }] }, { name: "UninterpretedOption", field: [{ name: "name", number: 2, type: 11, label: 3, typeName: ".google.protobuf.UninterpretedOption.NamePart" }, { name: "identifier_value", number: 3, type: 9, label: 1 }, { name: "positive_int_value", number: 4, type: 4, label: 1 }, { name: "negative_int_value", number: 5, type: 3, label: 1 }, { name: "double_value", number: 6, type: 1, label: 1 }, { name: "string_value", number: 7, type: 12, label: 1 }, { name: "aggregate_value", number: 8, type: 9, label: 1 }], nestedType: [{ name: "NamePart", field: [{ name: "name_part", number: 1, type: 9, label: 2 }, { name: "is_extension", number: 2, type: 8, label: 2 }] }] }, { name: "FeatureSet", field: [{ name: "field_presence", number: 1, type: 14, label: 1, typeName: ".google.protobuf.FeatureSet.FieldPresence", options: { retention: 1, targets: [4, 1], editionDefaults: [{ value: "EXPLICIT", edition: 900 }, { value: "IMPLICIT", edition: 999 }, { value: "EXPLICIT", edition: 1000 }] } }, { name: "enum_type", number: 2, type: 14, label: 1, typeName: ".google.protobuf.FeatureSet.EnumType", options: { retention: 1, targets: [6, 1], editionDefaults: [{ value: "CLOSED", edition: 900 }, { value: "OPEN", edition: 999 }] } }, { name: "repeated_field_encoding", number: 3, type: 14, label: 1, typeName: ".google.protobuf.FeatureSet.RepeatedFieldEncoding", options: { retention: 1, targets: [4, 1], editionDefaults: [{ value: "EXPANDED", edition: 900 }, { value: "PACKED", edition: 999 }] } }, { name: "utf8_validation", number: 4, type: 14, label: 1, typeName: ".google.protobuf.FeatureSet.Utf8Validation", options: { retention: 1, targets: [4, 1], editionDefaults: [{ value: "NONE", edition: 900 }, { value: "VERIFY", edition: 999 }] } }, { name: "message_encoding", number: 5, type: 14, label: 1, typeName: ".google.protobuf.FeatureSet.MessageEncoding", options: { retention: 1, targets: [4, 1], editionDefaults: [{ value: "LENGTH_PREFIXED", edition: 900 }] } }, { name: "json_format", number: 6, type: 14, label: 1, typeName: ".google.protobuf.FeatureSet.JsonFormat", options: { retention: 1, targets: [3, 6, 1], editionDefaults: [{ value: "LEGACY_BEST_EFFORT", edition: 900 }, { value: "ALLOW", edition: 999 }] } }, { name: "enforce_naming_style", number: 7, type: 14, label: 1, typeName: ".google.protobuf.FeatureSet.EnforceNamingStyle", options: { retention: 2, targets: [1, 2, 3, 4, 5, 6, 7, 8, 9], editionDefaults: [{ value: "STYLE_LEGACY", edition: 900 }, { value: "STYLE2024", edition: 1001 }] } }, { name: "default_symbol_visibility", number: 8, type: 14, label: 1, typeName: ".google.protobuf.FeatureSet.VisibilityFeature.DefaultSymbolVisibility", options: { retention: 2, targets: [1], editionDefaults: [{ value: "EXPORT_ALL", edition: 900 }, { value: "EXPORT_TOP_LEVEL", edition: 1001 }] } }], nestedType: [{ name: "VisibilityFeature", enumType: [{ name: "DefaultSymbolVisibility", value: [{ name: "DEFAULT_SYMBOL_VISIBILITY_UNKNOWN", number: 0 }, { name: "EXPORT_ALL", number: 1 }, { name: "EXPORT_TOP_LEVEL", number: 2 }, { name: "LOCAL_ALL", number: 3 }, { name: "STRICT", number: 4 }] }] }], enumType: [{ name: "FieldPresence", value: [{ name: "FIELD_PRESENCE_UNKNOWN", number: 0 }, { name: "EXPLICIT", number: 1 }, { name: "IMPLICIT", number: 2 }, { name: "LEGACY_REQUIRED", number: 3 }] }, { name: "EnumType", value: [{ name: "ENUM_TYPE_UNKNOWN", number: 0 }, { name: "OPEN", number: 1 }, { name: "CLOSED", number: 2 }] }, { name: "RepeatedFieldEncoding", value: [{ name: "REPEATED_FIELD_ENCODING_UNKNOWN", number: 0 }, { name: "PACKED", number: 1 }, { name: "EXPANDED", number: 2 }] }, { name: "Utf8Validation", value: [{ name: "UTF8_VALIDATION_UNKNOWN", number: 0 }, { name: "VERIFY", number: 2 }, { name: "NONE", number: 3 }] }, { name: "MessageEncoding", value: [{ name: "MESSAGE_ENCODING_UNKNOWN", number: 0 }, { name: "LENGTH_PREFIXED", number: 1 }, { name: "DELIMITED", number: 2 }] }, { name: "JsonFormat", value: [{ name: "JSON_FORMAT_UNKNOWN", number: 0 }, { name: "ALLOW", number: 1 }, { name: "LEGACY_BEST_EFFORT", number: 2 }] }, { name: "EnforceNamingStyle", value: [{ name: "ENFORCE_NAMING_STYLE_UNKNOWN", number: 0 }, { name: "STYLE2024", number: 1 }, { name: "STYLE_LEGACY", number: 2 }] }], extensionRange: [{ start: 1000, end: 9995 }, { start: 9995, end: 1e4 }, { start: 1e4, end: 10001 }] }, { name: "FeatureSetDefaults", field: [{ name: "defaults", number: 1, type: 11, label: 3, typeName: ".google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault" }, { name: "minimum_edition", number: 4, type: 14, label: 1, typeName: ".google.protobuf.Edition" }, { name: "maximum_edition", number: 5, type: 14, label: 1, typeName: ".google.protobuf.Edition" }], nestedType: [{ name: "FeatureSetEditionDefault", field: [{ name: "edition", number: 3, type: 14, label: 1, typeName: ".google.protobuf.Edition" }, { name: "overridable_features", number: 4, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }, { name: "fixed_features", number: 5, type: 11, label: 1, typeName: ".google.protobuf.FeatureSet" }] }] }, { name: "SourceCodeInfo", field: [{ name: "location", number: 1, type: 11, label: 3, typeName: ".google.protobuf.SourceCodeInfo.Location" }], nestedType: [{ name: "Location", field: [{ name: "path", number: 1, type: 5, label: 3, options: { packed: true } }, { name: "span", number: 2, type: 5, label: 3, options: { packed: true } }, { name: "leading_comments", number: 3, type: 9, label: 1 }, { name: "trailing_comments", number: 4, type: 9, label: 1 }, { name: "leading_detached_comments", number: 6, type: 9, label: 3 }] }], extensionRange: [{ start: 536000000, end: 536000001 }] }, { name: "GeneratedCodeInfo", field: [{ name: "annotation", number: 1, type: 11, label: 3, typeName: ".google.protobuf.GeneratedCodeInfo.Annotation" }], nestedType: [{ name: "Annotation", field: [{ name: "path", number: 1, type: 5, label: 3, options: { packed: true } }, { name: "source_file", number: 2, type: 9, label: 1 }, { name: "begin", number: 3, type: 5, label: 1 }, { name: "end", number: 4, type: 5, label: 1 }, { name: "semantic", number: 5, type: 14, label: 1, typeName: ".google.protobuf.GeneratedCodeInfo.Annotation.Semantic" }], enumType: [{ name: "Semantic", value: [{ name: "NONE", number: 0 }, { name: "SET", number: 1 }, { name: "ALIAS", number: 2 }] }] }] }], enumType: [{ name: "Edition", value: [{ name: "EDITION_UNKNOWN", number: 0 }, { name: "EDITION_LEGACY", number: 900 }, { name: "EDITION_PROTO2", number: 998 }, { name: "EDITION_PROTO3", number: 999 }, { name: "EDITION_2023", number: 1000 }, { name: "EDITION_2024", number: 1001 }, { name: "EDITION_UNSTABLE", number: 9999 }, { name: "EDITION_1_TEST_ONLY", number: 1 }, { name: "EDITION_2_TEST_ONLY", number: 2 }, { name: "EDITION_99997_TEST_ONLY", number: 99997 }, { name: "EDITION_99998_TEST_ONLY", number: 99998 }, { name: "EDITION_99999_TEST_ONLY", number: 99999 }, { name: "EDITION_MAX", number: 2147483647 }] }, { name: "SymbolVisibility", value: [{ name: "VISIBILITY_UNSET", number: 0 }, { name: "VISIBILITY_LOCAL", number: 1 }, { name: "VISIBILITY_EXPORT", number: 2 }] }] });
var FileDescriptorProtoSchema = /* @__PURE__ */ messageDesc(file_google_protobuf_descriptor, 1);
var ExtensionRangeOptions_VerificationState;
(function(ExtensionRangeOptions_VerificationState2) {
  ExtensionRangeOptions_VerificationState2[ExtensionRangeOptions_VerificationState2["DECLARATION"] = 0] = "DECLARATION";
  ExtensionRangeOptions_VerificationState2[ExtensionRangeOptions_VerificationState2["UNVERIFIED"] = 1] = "UNVERIFIED";
})(ExtensionRangeOptions_VerificationState || (ExtensionRangeOptions_VerificationState = {}));
var FieldDescriptorProto_Type;
(function(FieldDescriptorProto_Type2) {
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["DOUBLE"] = 1] = "DOUBLE";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["FLOAT"] = 2] = "FLOAT";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["INT64"] = 3] = "INT64";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["UINT64"] = 4] = "UINT64";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["INT32"] = 5] = "INT32";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["FIXED64"] = 6] = "FIXED64";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["FIXED32"] = 7] = "FIXED32";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["BOOL"] = 8] = "BOOL";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["STRING"] = 9] = "STRING";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["GROUP"] = 10] = "GROUP";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["MESSAGE"] = 11] = "MESSAGE";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["BYTES"] = 12] = "BYTES";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["UINT32"] = 13] = "UINT32";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["ENUM"] = 14] = "ENUM";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["SFIXED32"] = 15] = "SFIXED32";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["SFIXED64"] = 16] = "SFIXED64";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["SINT32"] = 17] = "SINT32";
  FieldDescriptorProto_Type2[FieldDescriptorProto_Type2["SINT64"] = 18] = "SINT64";
})(FieldDescriptorProto_Type || (FieldDescriptorProto_Type = {}));
var FieldDescriptorProto_Label;
(function(FieldDescriptorProto_Label2) {
  FieldDescriptorProto_Label2[FieldDescriptorProto_Label2["OPTIONAL"] = 1] = "OPTIONAL";
  FieldDescriptorProto_Label2[FieldDescriptorProto_Label2["REPEATED"] = 3] = "REPEATED";
  FieldDescriptorProto_Label2[FieldDescriptorProto_Label2["REQUIRED"] = 2] = "REQUIRED";
})(FieldDescriptorProto_Label || (FieldDescriptorProto_Label = {}));
var FileOptions_OptimizeMode;
(function(FileOptions_OptimizeMode2) {
  FileOptions_OptimizeMode2[FileOptions_OptimizeMode2["SPEED"] = 1] = "SPEED";
  FileOptions_OptimizeMode2[FileOptions_OptimizeMode2["CODE_SIZE"] = 2] = "CODE_SIZE";
  FileOptions_OptimizeMode2[FileOptions_OptimizeMode2["LITE_RUNTIME"] = 3] = "LITE_RUNTIME";
})(FileOptions_OptimizeMode || (FileOptions_OptimizeMode = {}));
var FieldOptions_CType;
(function(FieldOptions_CType2) {
  FieldOptions_CType2[FieldOptions_CType2["STRING"] = 0] = "STRING";
  FieldOptions_CType2[FieldOptions_CType2["CORD"] = 1] = "CORD";
  FieldOptions_CType2[FieldOptions_CType2["STRING_PIECE"] = 2] = "STRING_PIECE";
})(FieldOptions_CType || (FieldOptions_CType = {}));
var FieldOptions_JSType;
(function(FieldOptions_JSType2) {
  FieldOptions_JSType2[FieldOptions_JSType2["JS_NORMAL"] = 0] = "JS_NORMAL";
  FieldOptions_JSType2[FieldOptions_JSType2["JS_STRING"] = 1] = "JS_STRING";
  FieldOptions_JSType2[FieldOptions_JSType2["JS_NUMBER"] = 2] = "JS_NUMBER";
})(FieldOptions_JSType || (FieldOptions_JSType = {}));
var FieldOptions_OptionRetention;
(function(FieldOptions_OptionRetention2) {
  FieldOptions_OptionRetention2[FieldOptions_OptionRetention2["RETENTION_UNKNOWN"] = 0] = "RETENTION_UNKNOWN";
  FieldOptions_OptionRetention2[FieldOptions_OptionRetention2["RETENTION_RUNTIME"] = 1] = "RETENTION_RUNTIME";
  FieldOptions_OptionRetention2[FieldOptions_OptionRetention2["RETENTION_SOURCE"] = 2] = "RETENTION_SOURCE";
})(FieldOptions_OptionRetention || (FieldOptions_OptionRetention = {}));
var FieldOptions_OptionTargetType;
(function(FieldOptions_OptionTargetType2) {
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_UNKNOWN"] = 0] = "TARGET_TYPE_UNKNOWN";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_FILE"] = 1] = "TARGET_TYPE_FILE";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_EXTENSION_RANGE"] = 2] = "TARGET_TYPE_EXTENSION_RANGE";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_MESSAGE"] = 3] = "TARGET_TYPE_MESSAGE";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_FIELD"] = 4] = "TARGET_TYPE_FIELD";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_ONEOF"] = 5] = "TARGET_TYPE_ONEOF";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_ENUM"] = 6] = "TARGET_TYPE_ENUM";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_ENUM_ENTRY"] = 7] = "TARGET_TYPE_ENUM_ENTRY";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_SERVICE"] = 8] = "TARGET_TYPE_SERVICE";
  FieldOptions_OptionTargetType2[FieldOptions_OptionTargetType2["TARGET_TYPE_METHOD"] = 9] = "TARGET_TYPE_METHOD";
})(FieldOptions_OptionTargetType || (FieldOptions_OptionTargetType = {}));
var MethodOptions_IdempotencyLevel;
(function(MethodOptions_IdempotencyLevel2) {
  MethodOptions_IdempotencyLevel2[MethodOptions_IdempotencyLevel2["IDEMPOTENCY_UNKNOWN"] = 0] = "IDEMPOTENCY_UNKNOWN";
  MethodOptions_IdempotencyLevel2[MethodOptions_IdempotencyLevel2["NO_SIDE_EFFECTS"] = 1] = "NO_SIDE_EFFECTS";
  MethodOptions_IdempotencyLevel2[MethodOptions_IdempotencyLevel2["IDEMPOTENT"] = 2] = "IDEMPOTENT";
})(MethodOptions_IdempotencyLevel || (MethodOptions_IdempotencyLevel = {}));
var FeatureSet_VisibilityFeature_DefaultSymbolVisibility;
(function(FeatureSet_VisibilityFeature_DefaultSymbolVisibility2) {
  FeatureSet_VisibilityFeature_DefaultSymbolVisibility2[FeatureSet_VisibilityFeature_DefaultSymbolVisibility2["DEFAULT_SYMBOL_VISIBILITY_UNKNOWN"] = 0] = "DEFAULT_SYMBOL_VISIBILITY_UNKNOWN";
  FeatureSet_VisibilityFeature_DefaultSymbolVisibility2[FeatureSet_VisibilityFeature_DefaultSymbolVisibility2["EXPORT_ALL"] = 1] = "EXPORT_ALL";
  FeatureSet_VisibilityFeature_DefaultSymbolVisibility2[FeatureSet_VisibilityFeature_DefaultSymbolVisibility2["EXPORT_TOP_LEVEL"] = 2] = "EXPORT_TOP_LEVEL";
  FeatureSet_VisibilityFeature_DefaultSymbolVisibility2[FeatureSet_VisibilityFeature_DefaultSymbolVisibility2["LOCAL_ALL"] = 3] = "LOCAL_ALL";
  FeatureSet_VisibilityFeature_DefaultSymbolVisibility2[FeatureSet_VisibilityFeature_DefaultSymbolVisibility2["STRICT"] = 4] = "STRICT";
})(FeatureSet_VisibilityFeature_DefaultSymbolVisibility || (FeatureSet_VisibilityFeature_DefaultSymbolVisibility = {}));
var FeatureSet_FieldPresence;
(function(FeatureSet_FieldPresence2) {
  FeatureSet_FieldPresence2[FeatureSet_FieldPresence2["FIELD_PRESENCE_UNKNOWN"] = 0] = "FIELD_PRESENCE_UNKNOWN";
  FeatureSet_FieldPresence2[FeatureSet_FieldPresence2["EXPLICIT"] = 1] = "EXPLICIT";
  FeatureSet_FieldPresence2[FeatureSet_FieldPresence2["IMPLICIT"] = 2] = "IMPLICIT";
  FeatureSet_FieldPresence2[FeatureSet_FieldPresence2["LEGACY_REQUIRED"] = 3] = "LEGACY_REQUIRED";
})(FeatureSet_FieldPresence || (FeatureSet_FieldPresence = {}));
var FeatureSet_EnumType;
(function(FeatureSet_EnumType2) {
  FeatureSet_EnumType2[FeatureSet_EnumType2["ENUM_TYPE_UNKNOWN"] = 0] = "ENUM_TYPE_UNKNOWN";
  FeatureSet_EnumType2[FeatureSet_EnumType2["OPEN"] = 1] = "OPEN";
  FeatureSet_EnumType2[FeatureSet_EnumType2["CLOSED"] = 2] = "CLOSED";
})(FeatureSet_EnumType || (FeatureSet_EnumType = {}));
var FeatureSet_RepeatedFieldEncoding;
(function(FeatureSet_RepeatedFieldEncoding2) {
  FeatureSet_RepeatedFieldEncoding2[FeatureSet_RepeatedFieldEncoding2["REPEATED_FIELD_ENCODING_UNKNOWN"] = 0] = "REPEATED_FIELD_ENCODING_UNKNOWN";
  FeatureSet_RepeatedFieldEncoding2[FeatureSet_RepeatedFieldEncoding2["PACKED"] = 1] = "PACKED";
  FeatureSet_RepeatedFieldEncoding2[FeatureSet_RepeatedFieldEncoding2["EXPANDED"] = 2] = "EXPANDED";
})(FeatureSet_RepeatedFieldEncoding || (FeatureSet_RepeatedFieldEncoding = {}));
var FeatureSet_Utf8Validation;
(function(FeatureSet_Utf8Validation2) {
  FeatureSet_Utf8Validation2[FeatureSet_Utf8Validation2["UTF8_VALIDATION_UNKNOWN"] = 0] = "UTF8_VALIDATION_UNKNOWN";
  FeatureSet_Utf8Validation2[FeatureSet_Utf8Validation2["VERIFY"] = 2] = "VERIFY";
  FeatureSet_Utf8Validation2[FeatureSet_Utf8Validation2["NONE"] = 3] = "NONE";
})(FeatureSet_Utf8Validation || (FeatureSet_Utf8Validation = {}));
var FeatureSet_MessageEncoding;
(function(FeatureSet_MessageEncoding2) {
  FeatureSet_MessageEncoding2[FeatureSet_MessageEncoding2["MESSAGE_ENCODING_UNKNOWN"] = 0] = "MESSAGE_ENCODING_UNKNOWN";
  FeatureSet_MessageEncoding2[FeatureSet_MessageEncoding2["LENGTH_PREFIXED"] = 1] = "LENGTH_PREFIXED";
  FeatureSet_MessageEncoding2[FeatureSet_MessageEncoding2["DELIMITED"] = 2] = "DELIMITED";
})(FeatureSet_MessageEncoding || (FeatureSet_MessageEncoding = {}));
var FeatureSet_JsonFormat;
(function(FeatureSet_JsonFormat2) {
  FeatureSet_JsonFormat2[FeatureSet_JsonFormat2["JSON_FORMAT_UNKNOWN"] = 0] = "JSON_FORMAT_UNKNOWN";
  FeatureSet_JsonFormat2[FeatureSet_JsonFormat2["ALLOW"] = 1] = "ALLOW";
  FeatureSet_JsonFormat2[FeatureSet_JsonFormat2["LEGACY_BEST_EFFORT"] = 2] = "LEGACY_BEST_EFFORT";
})(FeatureSet_JsonFormat || (FeatureSet_JsonFormat = {}));
var FeatureSet_EnforceNamingStyle;
(function(FeatureSet_EnforceNamingStyle2) {
  FeatureSet_EnforceNamingStyle2[FeatureSet_EnforceNamingStyle2["ENFORCE_NAMING_STYLE_UNKNOWN"] = 0] = "ENFORCE_NAMING_STYLE_UNKNOWN";
  FeatureSet_EnforceNamingStyle2[FeatureSet_EnforceNamingStyle2["STYLE2024"] = 1] = "STYLE2024";
  FeatureSet_EnforceNamingStyle2[FeatureSet_EnforceNamingStyle2["STYLE_LEGACY"] = 2] = "STYLE_LEGACY";
})(FeatureSet_EnforceNamingStyle || (FeatureSet_EnforceNamingStyle = {}));
var GeneratedCodeInfo_Annotation_Semantic;
(function(GeneratedCodeInfo_Annotation_Semantic2) {
  GeneratedCodeInfo_Annotation_Semantic2[GeneratedCodeInfo_Annotation_Semantic2["NONE"] = 0] = "NONE";
  GeneratedCodeInfo_Annotation_Semantic2[GeneratedCodeInfo_Annotation_Semantic2["SET"] = 1] = "SET";
  GeneratedCodeInfo_Annotation_Semantic2[GeneratedCodeInfo_Annotation_Semantic2["ALIAS"] = 2] = "ALIAS";
})(GeneratedCodeInfo_Annotation_Semantic || (GeneratedCodeInfo_Annotation_Semantic = {}));
var Edition;
(function(Edition2) {
  Edition2[Edition2["EDITION_UNKNOWN"] = 0] = "EDITION_UNKNOWN";
  Edition2[Edition2["EDITION_LEGACY"] = 900] = "EDITION_LEGACY";
  Edition2[Edition2["EDITION_PROTO2"] = 998] = "EDITION_PROTO2";
  Edition2[Edition2["EDITION_PROTO3"] = 999] = "EDITION_PROTO3";
  Edition2[Edition2["EDITION_2023"] = 1000] = "EDITION_2023";
  Edition2[Edition2["EDITION_2024"] = 1001] = "EDITION_2024";
  Edition2[Edition2["EDITION_UNSTABLE"] = 9999] = "EDITION_UNSTABLE";
  Edition2[Edition2["EDITION_1_TEST_ONLY"] = 1] = "EDITION_1_TEST_ONLY";
  Edition2[Edition2["EDITION_2_TEST_ONLY"] = 2] = "EDITION_2_TEST_ONLY";
  Edition2[Edition2["EDITION_99997_TEST_ONLY"] = 99997] = "EDITION_99997_TEST_ONLY";
  Edition2[Edition2["EDITION_99998_TEST_ONLY"] = 99998] = "EDITION_99998_TEST_ONLY";
  Edition2[Edition2["EDITION_99999_TEST_ONLY"] = 99999] = "EDITION_99999_TEST_ONLY";
  Edition2[Edition2["EDITION_MAX"] = 2147483647] = "EDITION_MAX";
})(Edition || (Edition = {}));
var SymbolVisibility;
(function(SymbolVisibility2) {
  SymbolVisibility2[SymbolVisibility2["VISIBILITY_UNSET"] = 0] = "VISIBILITY_UNSET";
  SymbolVisibility2[SymbolVisibility2["VISIBILITY_LOCAL"] = 1] = "VISIBILITY_LOCAL";
  SymbolVisibility2[SymbolVisibility2["VISIBILITY_EXPORT"] = 2] = "VISIBILITY_EXPORT";
})(SymbolVisibility || (SymbolVisibility = {}));

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/from-binary.js
var readDefaults = {
  readUnknownFields: true
};
function makeReadOptions(options) {
  return options ? Object.assign(Object.assign({}, readDefaults), options) : readDefaults;
}
function fromBinary(schema, bytes, options) {
  const msg = reflect(schema, undefined, false);
  readMessage(msg, new BinaryReader(bytes), makeReadOptions(options), false, bytes.byteLength);
  return msg.message;
}
function readMessage(message, reader, options, delimited, lengthOrDelimitedFieldNo) {
  var _a;
  const end = delimited ? reader.len : reader.pos + lengthOrDelimitedFieldNo;
  let fieldNo;
  let wireType;
  const unknownFields = (_a = message.getUnknown()) !== null && _a !== undefined ? _a : [];
  while (reader.pos < end) {
    [fieldNo, wireType] = reader.tag();
    if (delimited && wireType == WireType.EndGroup) {
      break;
    }
    const field = message.findNumber(fieldNo);
    if (!field) {
      const data = reader.skip(wireType, fieldNo);
      if (options.readUnknownFields) {
        unknownFields.push({ no: fieldNo, wireType, data });
      }
      continue;
    }
    readField(message, reader, field, wireType, options);
  }
  if (delimited) {
    if (wireType != WireType.EndGroup || fieldNo !== lengthOrDelimitedFieldNo) {
      throw new Error("invalid end group tag");
    }
  }
  if (unknownFields.length > 0) {
    message.setUnknown(unknownFields);
  }
}
function readField(message, reader, field, wireType, options) {
  var _a;
  switch (field.fieldKind) {
    case "scalar":
      message.set(field, readScalar(reader, field.scalar, field.utf8Validation));
      break;
    case "enum":
      const val = readScalar(reader, ScalarType.INT32);
      if (field.enum.open) {
        message.set(field, val);
      } else {
        const ok = field.enum.values.some((v) => v.number === val);
        if (ok) {
          message.set(field, val);
        } else if (options.readUnknownFields) {
          const bytes = [];
          varint32write(val, bytes);
          const unknownFields = (_a = message.getUnknown()) !== null && _a !== undefined ? _a : [];
          unknownFields.push({
            no: field.number,
            wireType,
            data: new Uint8Array(bytes)
          });
          message.setUnknown(unknownFields);
        }
      }
      break;
    case "message":
      message.set(field, readMessageField(reader, options, field, message.get(field)));
      break;
    case "list":
      readListField(reader, wireType, message.get(field), options);
      break;
    case "map":
      readMapEntry(reader, message.get(field), options);
      break;
  }
}
function readMapEntry(reader, map, options) {
  const field = map.field();
  let key;
  let val;
  const len = reader.uint32();
  const end = reader.pos + len;
  while (reader.pos < end) {
    const [fieldNo] = reader.tag();
    switch (fieldNo) {
      case 1:
        key = readScalar(reader, field.mapKey, field.utf8Validation);
        break;
      case 2:
        switch (field.mapKind) {
          case "scalar":
            val = readScalar(reader, field.scalar, field.utf8Validation);
            break;
          case "enum":
            val = reader.int32();
            break;
          case "message":
            val = readMessageField(reader, options, field);
            break;
        }
        break;
    }
  }
  if (key === undefined) {
    key = scalarZeroValue(field.mapKey, false);
  }
  if (val === undefined) {
    switch (field.mapKind) {
      case "scalar":
        val = scalarZeroValue(field.scalar, false);
        break;
      case "enum":
        val = field.enum.values[0].number;
        break;
      case "message":
        val = reflect(field.message, undefined, false);
        break;
    }
  }
  map.set(key, val);
}
function readListField(reader, wireType, list, options) {
  var _a;
  const field = list.field();
  if (field.listKind === "message") {
    list.add(readMessageField(reader, options, field));
    return;
  }
  const scalarType = (_a = field.scalar) !== null && _a !== undefined ? _a : ScalarType.INT32;
  const packed = wireType == WireType.LengthDelimited && scalarType != ScalarType.STRING && scalarType != ScalarType.BYTES;
  if (!packed) {
    list.add(readScalar(reader, scalarType, field.utf8Validation));
    return;
  }
  const e = reader.uint32() + reader.pos;
  while (reader.pos < e) {
    list.add(readScalar(reader, scalarType, field.utf8Validation));
  }
}
function readMessageField(reader, options, field, mergeMessage) {
  const delimited = field.delimitedEncoding;
  const message = mergeMessage !== null && mergeMessage !== undefined ? mergeMessage : reflect(field.message, undefined, false);
  readMessage(message, reader, options, delimited, delimited ? field.number : reader.uint32());
  return message;
}
function readScalar(reader, type, validateUtf8 = false) {
  switch (type) {
    case ScalarType.STRING:
      return reader.string(validateUtf8);
    case ScalarType.BOOL:
      return reader.bool();
    case ScalarType.DOUBLE:
      return reader.double();
    case ScalarType.FLOAT:
      return reader.float();
    case ScalarType.INT32:
      return reader.int32();
    case ScalarType.INT64:
      return reader.int64();
    case ScalarType.UINT64:
      return reader.uint64();
    case ScalarType.FIXED64:
      return reader.fixed64();
    case ScalarType.BYTES:
      return reader.bytes();
    case ScalarType.FIXED32:
      return reader.fixed32();
    case ScalarType.SFIXED32:
      return reader.sfixed32();
    case ScalarType.SFIXED64:
      return reader.sfixed64();
    case ScalarType.SINT64:
      return reader.sint64();
    case ScalarType.UINT32:
      return reader.uint32();
    case ScalarType.SINT32:
      return reader.sint32();
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/codegenv2/file.js
function fileDesc(b64, imports) {
  var _a;
  const root = fromBinary(FileDescriptorProtoSchema, base64Decode(b64));
  root.messageType.forEach(restoreJsonNames);
  root.dependency = (_a = imports === null || imports === undefined ? undefined : imports.map((f) => f.proto.name)) !== null && _a !== undefined ? _a : [];
  const reg = createFileRegistry(root, (protoFileName) => imports === null || imports === undefined ? undefined : imports.find((f) => f.proto.name === protoFileName));
  return reg.getFile(root.name);
}

// packages/proto/src/gen/content_pb.ts
var file_content = /* @__PURE__ */ fileDesc("Cg1jb250ZW50LnByb3RvEhVhcmNoZWdseXBoLmNvbnRlbnQudjEiyAEKB0RpYWdyYW0SFgoOc2NoZW1hX3ZlcnNpb24YASABKA0SCgoCaWQYAiABKAkSMgoFdGl0bGUYAyADKAsyIy5hcmNoZWdseXBoLmNvbnRlbnQudjEuTG9jYWxpemF0aW9uEisKBWdyYXBoGAQgASgLMhwuYXJjaGVnbHlwaC5jb250ZW50LnYxLkdyYXBoEjgKCG1ldGFkYXRhGAUgASgLMiYuYXJjaGVnbHlwaC5jb250ZW50LnYxLkRpYWdyYW1NZXRhZGF0YSKrAgoPRGlhZ3JhbU1ldGFkYXRhEhYKCWdlbmVyYXRvchgBIAEoCUgAiAEBEhcKCmNyZWF0ZWRfYXQYAiABKAlIAYgBARIXCgp1cGRhdGVkX2F0GAMgASgJSAKIAQESHQoQY2Fub25pY2FsX2xvY2FsZRgEIAEoCUgDiAEBEkAKBWV4dHJhGAogAygLMjEuYXJjaGVnbHlwaC5jb250ZW50LnYxLkRpYWdyYW1NZXRhZGF0YS5FeHRyYUVudHJ5GiwKCkV4dHJhRW50cnkSCwoDa2V5GAEgASgJEg0KBXZhbHVlGAIgASgJOgI4AUIMCgpfZ2VuZXJhdG9yQg0KC19jcmVhdGVkX2F0Qg0KC191cGRhdGVkX2F0QhMKEV9jYW5vbmljYWxfbG9jYWxlIpkCCgVHcmFwaBI8CghlbGVtZW50cxgBIAMoCzIqLmFyY2hlZ2x5cGguY29udGVudC52MS5HcmFwaC5FbGVtZW50c0VudHJ5EjYKBWVkZ2VzGAIgAygLMicuYXJjaGVnbHlwaC5jb250ZW50LnYxLkdyYXBoLkVkZ2VzRW50cnkaTwoNRWxlbWVudHNFbnRyeRILCgNrZXkYASABKAkSLQoFdmFsdWUYAiABKAsyHi5hcmNoZWdseXBoLmNvbnRlbnQudjEuRWxlbWVudDoCOAEaSQoKRWRnZXNFbnRyeRILCgNrZXkYASABKAkSKgoFdmFsdWUYAiABKAsyGy5hcmNoZWdseXBoLmNvbnRlbnQudjEuRWRnZToCOAEi9AEKB0VsZW1lbnQSMgoFbGFiZWwYAiADKAsyIy5hcmNoZWdseXBoLmNvbnRlbnQudjEuTG9jYWxpemF0aW9uEhMKBnBhcmVudBgDIAEoCUgAiAEBEjYKBHRhZ3MYBCADKAsyKC5hcmNoZWdseXBoLmNvbnRlbnQudjEuRWxlbWVudC5UYWdzRW50cnkSMAoEcm9sZRgFIAEoDjIiLmFyY2hlZ2x5cGguY29udGVudC52MS5FbGVtZW50Um9sZRorCglUYWdzRW50cnkSCwoDa2V5GAEgASgJEg0KBXZhbHVlGAIgASgJOgI4AUIJCgdfcGFyZW50Is0BCgRFZGdlEg4KBnNvdXJjZRgCIAEoCRIOCgZ0YXJnZXQYAyABKAkSMgoFbGFiZWwYBCADKAsyIy5hcmNoZWdseXBoLmNvbnRlbnQudjEuTG9jYWxpemF0aW9uEg8KB29yZGluYWwYBSABKA0SMwoEdGFncxgGIAMoCzIlLmFyY2hlZ2x5cGguY29udGVudC52MS5FZGdlLlRhZ3NFbnRyeRorCglUYWdzRW50cnkSCwoDa2V5GAEgASgJEg0KBXZhbHVlGAIgASgJOgI4ASK5AQoFRGVsdGESFgoOc2NoZW1hX3ZlcnNpb24YASABKA0SEAoIYmFzZV9yZWYYAiABKAkSEgoKdGFyZ2V0X3JlZhgDIAEoCRI1CgtlZGdlX2RlbHRhcxgFIAMoCzIgLmFyY2hlZ2x5cGguY29udGVudC52MS5FZGdlRGVsdGESOwoOZWxlbWVudF9kZWx0YXMYBCADKAsyIy5hcmNoZWdseXBoLmNvbnRlbnQudjEuRWxlbWVudERlbHRhIoICCgxFbGVtZW50RGVsdGESEgoKZWxlbWVudF9pZBgBIAEoCRI2CgtjaGFuZ2VfdHlwZRgCIAEoDjIhLmFyY2hlZ2x5cGguY29udGVudC52MS5DaGFuZ2VUeXBlEjMKBmJlZm9yZRgDIAEoCzIeLmFyY2hlZ2x5cGguY29udGVudC52MS5FbGVtZW50SACIAQESMgoFYWZ0ZXIYBCABKAsyHi5hcmNoZWdseXBoLmNvbnRlbnQudjEuRWxlbWVudEgBiAEBEhgKC2Rlc2NyaXB0aW9uGAUgASgJSAKIAQFCCQoHX2JlZm9yZUIICgZfYWZ0ZXJCDgoMX2Rlc2NyaXB0aW9uIvYBCglFZGdlRGVsdGESDwoHZWRnZV9pZBgBIAEoCRI2CgtjaGFuZ2VfdHlwZRgCIAEoDjIhLmFyY2hlZ2x5cGguY29udGVudC52MS5DaGFuZ2VUeXBlEjAKBmJlZm9yZRgDIAEoCzIbLmFyY2hlZ2x5cGguY29udGVudC52MS5FZGdlSACIAQESLwoFYWZ0ZXIYBCABKAsyGy5hcmNoZWdseXBoLmNvbnRlbnQudjEuRWRnZUgBiAEBEhgKC2Rlc2NyaXB0aW9uGAUgASgJSAKIAQFCCQoHX2JlZm9yZUIICgZfYWZ0ZXJCDgoMX2Rlc2NyaXB0aW9uIi4KDExvY2FsaXphdGlvbhIOCgZsb2NhbGUYASABKAkSDgoGc291cmNlGAIgASgJKl8KC0VsZW1lbnRSb2xlEhwKGEVMRU1FTlRfUk9MRV9VTlNQRUNJRklFRBAAEhcKE0VMRU1FTlRfUk9MRV9FTlRJVFkQARIZChVFTEVNRU5UX1JPTEVfR1JPVVBJTkcQAipeCgpDaGFuZ2VUeXBlEhsKF0NIQU5HRV9UWVBFX1VOU1BFQ0lGSUVEEAASDQoJVU5DSEFOR0VEEAESCQoFQURERUQQAhILCgdERUxFVEVEEAMSDAoITU9ESUZJRUQQBGIGcHJvdG8z");
var DiagramSchema = /* @__PURE__ */ messageDesc(file_content, 0);
var GraphSchema = /* @__PURE__ */ messageDesc(file_content, 2);
var ElementSchema = /* @__PURE__ */ messageDesc(file_content, 3);
var EdgeSchema = /* @__PURE__ */ messageDesc(file_content, 4);
var DeltaSchema = /* @__PURE__ */ messageDesc(file_content, 5);
var ElementDeltaSchema = /* @__PURE__ */ messageDesc(file_content, 6);
var EdgeDeltaSchema = /* @__PURE__ */ messageDesc(file_content, 7);
var LocalizationSchema = /* @__PURE__ */ messageDesc(file_content, 8);

// packages/proto/src/gen/style_pb.ts
var file_style = /* @__PURE__ */ fileDesc("CgtzdHlsZS5wcm90bxITYXJjaGVnbHlwaC5zdHlsZS52MSKUBgoKU3R5bGVzaGVldBIWCg5zY2hlbWFfdmVyc2lvbhgBIAEoDRI7CgZ0aGVtZXMYAiADKAsyKy5hcmNoZWdseXBoLnN0eWxlLnYxLlN0eWxlc2hlZXQuVGhlbWVzRW50cnkSNQoGY2FudmFzGAMgASgLMiAuYXJjaGVnbHlwaC5zdHlsZS52MS5DYW52YXNTdHlsZUgAiAEBEj8KCGVsZW1lbnRzGAQgAygLMi0uYXJjaGVnbHlwaC5zdHlsZS52MS5TdHlsZXNoZWV0LkVsZW1lbnRzRW50cnkSOQoFZWRnZXMYBSADKAsyKi5hcmNoZWdseXBoLnN0eWxlLnYxLlN0eWxlc2hlZXQuRWRnZXNFbnRyeRJFCgthbm5vdGF0aW9ucxgHIAMoCzIwLmFyY2hlZ2x5cGguc3R5bGUudjEuU3R5bGVzaGVldC5Bbm5vdGF0aW9uc0VudHJ5EjUKDXBlbmRpbmdfZWRpdHMYCCADKAsyHi5hcmNoZWdseXBoLnN0eWxlLnYxLlN0eWxlRWRpdBIXCgpvcGVuX2RlcHRoGAYgASgNSAGIAQESGAoQc2hvd25fZWRnZV9raW5kcxgJIAMoCRotCgtUaGVtZXNFbnRyeRILCgNrZXkYASABKAkSDQoFdmFsdWUYAiABKAk6AjgBGlcKDUVsZW1lbnRzRW50cnkSCwoDa2V5GAEgASgJEjUKBXZhbHVlGAIgASgLMiYuYXJjaGVnbHlwaC5zdHlsZS52MS5FbGVtZW50U3R5bGVFbnRyeToCOAEaUQoKRWRnZXNFbnRyeRILCgNrZXkYASABKAkSMgoFdmFsdWUYAiABKAsyIy5hcmNoZWdseXBoLnN0eWxlLnYxLkVkZ2VTdHlsZUVudHJ5OgI4ARpYChBBbm5vdGF0aW9uc0VudHJ5EgsKA2tleRgBIAEoCRIzCgV2YWx1ZRgCIAEoCzIkLmFyY2hlZ2x5cGguc3R5bGUudjEuQW5ub3RhdGlvbkVudHJ5OgI4AUIJCgdfY2FudmFzQg0KC19vcGVuX2RlcHRoIpICCgtDYW52YXNTdHlsZRIzCgpiYWNrZ3JvdW5kGAEgASgLMhouYXJjaGVnbHlwaC5zdHlsZS52MS5Db2xvckgAiAEBEjUKDXZpZXdwb3J0X3NpemUYAiABKAsyGS5hcmNoZWdseXBoLnN0eWxlLnYxLlZlYzJIAYgBARITCgZtYXJnaW4YAyABKAFIAogBARIZCgxub2RlX3NwYWNpbmcYBCABKAFIA4gBARIZCgxlZGdlX3NwYWNpbmcYBSABKAFIBIgBAUINCgtfYmFja2dyb3VuZEIQCg5fdmlld3BvcnRfc2l6ZUIJCgdfbWFyZ2luQg8KDV9ub2RlX3NwYWNpbmdCDwoNX2VkZ2Vfc3BhY2luZyLNBAoRRWxlbWVudFN0eWxlRW50cnkSNwoGbGF5b3V0GAEgASgLMiIuYXJjaGVnbHlwaC5zdHlsZS52MS5FbGVtZW50TGF5b3V0SACIAQESNwoKYm94X2xheW91dBgCIAEoCzIeLmFyY2hlZ2x5cGguc3R5bGUudjEuQm94TGF5b3V0SAGIAQESPgoLcmVuZGVyX21vZGUYAyABKA4yJC5hcmNoZWdseXBoLnN0eWxlLnYxLkdyb3VwUmVuZGVyTW9kZUgCiAEBEjAKBXNoYXBlGAQgASgLMhwuYXJjaGVnbHlwaC5zdHlsZS52MS5HbHlwaDJESAOIAQESLgoDYm94GAUgASgLMhwuYXJjaGVnbHlwaC5zdHlsZS52MS5HbHlwaDJESASIAQESOAoKdHlwb2dyYXBoeRgGIAEoCzIfLmFyY2hlZ2x5cGguc3R5bGUudjEuVHlwb2dyYXBoeUgFiAEBEhYKCWNvbXBvbmVudBgHIAEoCUgGiAEBEhoKDWJveF9jb21wb25lbnQYCCABKAlIB4gBARI8Cgp2aXNpYmlsaXR5GAkgASgOMiMuYXJjaGVnbHlwaC5zdHlsZS52MS5Ob2RlVmlzaWJpbGl0eUgIiAEBQgkKB19sYXlvdXRCDQoLX2JveF9sYXlvdXRCDgoMX3JlbmRlcl9tb2RlQggKBl9zaGFwZUIGCgRfYm94Qg0KC190eXBvZ3JhcGh5QgwKCl9jb21wb25lbnRCEAoOX2JveF9jb21wb25lbnRCDQoLX3Zpc2liaWxpdHkihgIKDkVkZ2VTdHlsZUVudHJ5EjQKBmxheW91dBgBIAEoCzIfLmFyY2hlZ2x5cGguc3R5bGUudjEuRWRnZUxheW91dEgAiAEBEjUKCmNvbm5lY3Rpb24YAiABKAsyHC5hcmNoZWdseXBoLnN0eWxlLnYxLkdseXBoMURIAYgBARI4Cgp0eXBvZ3JhcGh5GAMgASgLMh8uYXJjaGVnbHlwaC5zdHlsZS52MS5UeXBvZ3JhcGh5SAKIAQESFgoJY29tcG9uZW50GAQgASgJSAOIAQFCCQoHX2xheW91dEINCgtfY29ubmVjdGlvbkINCgtfdHlwb2dyYXBoeUIMCgpfY29tcG9uZW50IqkBCg1FbGVtZW50TGF5b3V0EjAKCHBvc2l0aW9uGAEgASgLMhkuYXJjaGVnbHlwaC5zdHlsZS52MS5WZWMySACIAQESLAoEc2l6ZRgCIAEoCzIZLmFyY2hlZ2x5cGguc3R5bGUudjEuVmVjMkgBiAEBEhUKCHJvdGF0aW9uGAMgASgBSAKIAQFCCwoJX3Bvc2l0aW9uQgcKBV9zaXplQgsKCV9yb3RhdGlvbiKpAwoKRWRnZUxheW91dBI2Cgdyb3V0aW5nGAEgASgOMiAuYXJjaGVnbHlwaC5zdHlsZS52MS5FZGdlUm91dGluZ0gAiAEBEiwKCXdheXBvaW50cxgCIAMoCzIZLmFyY2hlZ2x5cGguc3R5bGUudjEuVmVjMhI1Cg1zb3VyY2VfYXR0YWNoGAMgASgLMhkuYXJjaGVnbHlwaC5zdHlsZS52MS5WZWMySAGIAQESNQoNdGFyZ2V0X2F0dGFjaBgEIAEoCzIZLmFyY2hlZ2x5cGguc3R5bGUudjEuVmVjMkgCiAEBEkIKDmxhYmVsX3Bvc2l0aW9uGAUgASgOMiUuYXJjaGVnbHlwaC5zdHlsZS52MS5FZGdlUGF0aFBvc2l0aW9uSAOIAQESJAoXbGFiZWxfcG9zaXRpb25fZnJhY3Rpb24YBiABKAFIBIgBAUIKCghfcm91dGluZ0IQCg5fc291cmNlX2F0dGFjaEIQCg5fdGFyZ2V0X2F0dGFjaEIRCg9fbGFiZWxfcG9zaXRpb25CGgoYX2xhYmVsX3Bvc2l0aW9uX2ZyYWN0aW9uIvwBCglCb3hMYXlvdXQSMAoIcG9zaXRpb24YASABKAsyGS5hcmNoZWdseXBoLnN0eWxlLnYxLlZlYzJIAIgBARIsCgRzaXplGAIgASgLMhkuYXJjaGVnbHlwaC5zdHlsZS52MS5WZWMySAGIAQESFAoHcGFkZGluZxgDIAEoAUgCiAEBEkQKDmxhYmVsX3Bvc2l0aW9uGAQgASgOMicuYXJjaGVnbHlwaC5zdHlsZS52MS5Hcm91cExhYmVsUG9zaXRpb25IA4gBAUILCglfcG9zaXRpb25CBwoFX3NpemVCCgoIX3BhZGRpbmdCEQoPX2xhYmVsX3Bvc2l0aW9uIqwBChBBbm5vdGF0aW9uTGF5b3V0EjAKCHBvc2l0aW9uGAEgASgLMhkuYXJjaGVnbHlwaC5zdHlsZS52MS5WZWMySACIAQESLAoEc2l6ZRgCIAEoCzIZLmFyY2hlZ2x5cGguc3R5bGUudjEuVmVjMkgBiAEBEhUKCHJvdGF0aW9uGAMgASgBSAKIAQFCCwoJX3Bvc2l0aW9uQgcKBV9zaXplQgsKCV9yb3RhdGlvbiL1AgoHR2x5cGgyRBIyCghzdGFuZGFyZBgBIAEoDjIeLmFyY2hlZ2x5cGguc3R5bGUudjEuU2hhcGVUeXBlSAASGQoPY3VzdG9tX3BhdGhfcmVmGAIgASgJSAASGgoNY29ybmVyX3JhZGl1cxgEIAEoAUgBiAEBEjAKBnN0cm9rZRgFIAEoCzIbLmFyY2hlZ2x5cGguc3R5bGUudjEuU3Ryb2tlSAKIAQESLAoEZmlsbBgGIAEoCzIZLmFyY2hlZ2x5cGguc3R5bGUudjEuRmlsbEgDiAEBEiwKBGdsb3cYByABKAsyGS5hcmNoZWdseXBoLnN0eWxlLnYxLkdsb3dIBIgBARI0CgtkZWNvcmF0aW9ucxgIIAMoCzIfLmFyY2hlZ2x5cGguc3R5bGUudjEuRGVjb3JhdGlvbkIMCgpzaGFwZV9raW5kQhAKDl9jb3JuZXJfcmFkaXVzQgkKB19zdHJva2VCBwoFX2ZpbGxCBwoFX2dsb3cixgEKB0dseXBoMUQSMAoGc3Ryb2tlGAEgASgLMhsuYXJjaGVnbHlwaC5zdHlsZS52MS5TdHJva2VIAIgBARI4CgphcnJvd2hlYWRzGAIgASgLMh8uYXJjaGVnbHlwaC5zdHlsZS52MS5BcnJvd2hlYWRzSAGIAQESLAoEZ2xvdxgDIAEoCzIZLmFyY2hlZ2x5cGguc3R5bGUudjEuR2xvd0gCiAEBQgkKB19zdHJva2VCDQoLX2Fycm93aGVhZHNCBwoFX2dsb3ci4wIKClR5cG9ncmFwaHkSEQoEZm9udBgBIAEoCUgAiAEBEi4KBWNvbG9yGAIgASgLMhouYXJjaGVnbHlwaC5zdHlsZS52MS5Db2xvckgBiAEBEhEKBHNpemUYAyABKAFIAogBARI0CgZ3ZWlnaHQYBCABKA4yHy5hcmNoZWdseXBoLnN0eWxlLnYxLkZvbnRXZWlnaHRIA4gBARIyCgVhbGlnbhgFIAEoDjIeLmFyY2hlZ2x5cGguc3R5bGUudjEuVGV4dEFsaWduSASIAQESFAoHdmlzaWJsZRgGIAEoCEgFiAEBEjMKCmJhY2tncm91bmQYByABKAsyGi5hcmNoZWdseXBoLnN0eWxlLnYxLkNvbG9ySAaIAQFCBwoFX2ZvbnRCCAoGX2NvbG9yQgcKBV9zaXplQgkKB193ZWlnaHRCCAoGX2FsaWduQgoKCF92aXNpYmxlQg0KC19iYWNrZ3JvdW5kIuQCCgZTdHJva2USKwoFY29sb3IYASABKAsyGi5hcmNoZWdseXBoLnN0eWxlLnYxLkNvbG9ySAASMQoIZ3JhZGllbnQYCCABKAsyHS5hcmNoZWdseXBoLnN0eWxlLnYxLkdyYWRpZW50SAASEgoFd2lkdGgYAiABKAFIAogBARI1CgdwYXR0ZXJuGAMgASgOMiIuYXJjaGVnbHlwaC5zdHlsZS52MS5TdHJva2VQYXR0ZXJuSAESGgoQY3VzdG9tX2Rhc2hhcnJheRgHIAEoCUgBEjAKA2NhcBgFIAEoDjIeLmFyY2hlZ2x5cGguc3R5bGUudjEuU3Ryb2tlQ2FwSAOIAQESMgoEam9pbhgGIAEoDjIfLmFyY2hlZ2x5cGguc3R5bGUudjEuU3Ryb2tlSm9pbkgEiAEBQgcKBXBhaW50QgkKB2Rhc2hpbmdCCAoGX3dpZHRoQgYKBF9jYXBCBwoFX2pvaW4ikQEKBEZpbGwSKwoFY29sb3IYASABKAsyGi5hcmNoZWdseXBoLnN0eWxlLnYxLkNvbG9ySAASMQoIZ3JhZGllbnQYAyABKAsyHS5hcmNoZWdseXBoLnN0eWxlLnYxLkdyYWRpZW50SAASFAoHb3BhY2l0eRgCIAEoAUgBiAEBQgcKBXBhaW50QgoKCF9vcGFjaXR5IosBCghHcmFkaWVudBIvCgR0eXBlGAEgASgOMiEuYXJjaGVnbHlwaC5zdHlsZS52MS5HcmFkaWVudFR5cGUSMAoFc3RvcHMYAiADKAsyIS5hcmNoZWdseXBoLnN0eWxlLnYxLkdyYWRpZW50U3RvcBISCgVhbmdsZRgDIAEoAUgAiAEBQggKBl9hbmdsZSJJCgxHcmFkaWVudFN0b3ASDgoGb2Zmc2V0GAEgASgBEikKBWNvbG9yGAIgASgLMhouYXJjaGVnbHlwaC5zdHlsZS52MS5Db2xvciKGAQoER2xvdxIuCgVjb2xvchgBIAEoCzIaLmFyY2hlZ2x5cGguc3R5bGUudjEuQ29sb3JIAIgBARITCgZyYWRpdXMYAiABKAFIAYgBARIWCglpbnRlbnNpdHkYBCABKAFIAogBAUIICgZfY29sb3JCCQoHX3JhZGl1c0IMCgpfaW50ZW5zaXR5IpIBCgpBcnJvd2hlYWRzEjQKBXN0YXJ0GAEgASgOMiUuYXJjaGVnbHlwaC5zdHlsZS52MS5BcnJvd2hlYWRWYXJpYW50EjIKA2VuZBgCIAEoDjIlLmFyY2hlZ2x5cGguc3R5bGUudjEuQXJyb3doZWFkVmFyaWFudBIRCgRzaXplGAMgASgBSACIAQFCBwoFX3NpemUioQIKCkRlY29yYXRpb24SCgoCaWQYASABKAkSMQoEa2luZBgCIAEoDjIjLmFyY2hlZ2x5cGguc3R5bGUudjEuRGVjb3JhdGlvbktpbmQSNwoKYmFkZ2VfdGV4dBgDIAMoCzIjLmFyY2hlZ2x5cGguY29udGVudC52MS5Mb2NhbGl6YXRpb24SFQoIaWNvbl9yZWYYBCABKAlIAIgBARIwCghwb3NpdGlvbhgFIAEoCzIZLmFyY2hlZ2x5cGguc3R5bGUudjEuVmVjMkgBiAEBEi4KBWNvbG9yGAYgASgLMhouYXJjaGVnbHlwaC5zdHlsZS52MS5Db2xvckgCiAEBQgsKCV9pY29uX3JlZkILCglfcG9zaXRpb25CCAoGX2NvbG9yIhwKBFZlYzISCQoBeBgBIAEoARIJCgF5GAIgASgBIhYKBUNvbG9yEg0KBXZhbHVlGAEgASgJIqsECg9Bbm5vdGF0aW9uRW50cnkSNAoHY29udGVudBgCIAMoCzIjLmFyY2hlZ2x5cGguY29udGVudC52MS5Mb2NhbGl6YXRpb24SOgoGYW5jaG9yGAMgASgLMiUuYXJjaGVnbHlwaC5zdHlsZS52MS5Bbm5vdGF0aW9uQW5jaG9ySACIAQESOgoGbGF5b3V0GAQgASgLMiUuYXJjaGVnbHlwaC5zdHlsZS52MS5Bbm5vdGF0aW9uTGF5b3V0SAGIAQESMAoFc2hhcGUYBSABKAsyHC5hcmNoZWdseXBoLnN0eWxlLnYxLkdseXBoMkRIAogBARI4Cgp0eXBvZ3JhcGh5GAYgASgLMh8uYXJjaGVnbHlwaC5zdHlsZS52MS5UeXBvZ3JhcGh5SAOIAQESMgoHY2FsbG91dBgHIAEoCzIcLmFyY2hlZ2x5cGguc3R5bGUudjEuR2x5cGgxREgEiAEBEhYKCWNvbXBvbmVudBgIIAEoCUgFiAEBEjwKBHRhZ3MYCSADKAsyLi5hcmNoZWdseXBoLnN0eWxlLnYxLkFubm90YXRpb25FbnRyeS5UYWdzRW50cnkaKwoJVGFnc0VudHJ5EgsKA2tleRgBIAEoCRINCgV2YWx1ZRgCIAEoCToCOAFCCQoHX2FuY2hvckIJCgdfbGF5b3V0QggKBl9zaGFwZUINCgtfdHlwb2dyYXBoeUIKCghfY2FsbG91dEIMCgpfY29tcG9uZW50Ip8BChBBbm5vdGF0aW9uQW5jaG9yEg4KBnJlZl9pZBgBIAEoCRIuCghyZWZfa2luZBgCIAEoDjIcLmFyY2hlZ2x5cGguc3R5bGUudjEuUmVmS2luZBI3Cg9hbmNob3JfcG9zaXRpb24YAyABKAsyGS5hcmNoZWdseXBoLnN0eWxlLnYxLlZlYzJIAIgBAUISChBfYW5jaG9yX3Bvc2l0aW9uIpYGCglTdHlsZUVkaXQSFgoOc2NoZW1hX3ZlcnNpb24YASABKA0SCgoCaWQYAiABKAkSFgoJYmFzZV9oYXNoGAMgASgJSACIAQESQAoPZWxlbWVudF9jaGFuZ2VzGAQgAygLMicuYXJjaGVnbHlwaC5zdHlsZS52MS5FbGVtZW50U3R5bGVDaGFuZ2USOgoMZWRnZV9jaGFuZ2VzGAUgAygLMiQuYXJjaGVnbHlwaC5zdHlsZS52MS5FZGdlU3R5bGVDaGFuZ2USRgoSYW5ub3RhdGlvbl9jaGFuZ2VzGAcgAygLMiouYXJjaGVnbHlwaC5zdHlsZS52MS5Bbm5vdGF0aW9uU3R5bGVDaGFuZ2USOwoMY2FudmFzX2FmdGVyGAggASgLMiAuYXJjaGVnbHlwaC5zdHlsZS52MS5DYW52YXNTdHlsZUgBiAEBEkUKDHRoZW1lc19hZnRlchgJIAMoCzIvLmFyY2hlZ2x5cGguc3R5bGUudjEuU3R5bGVFZGl0LlRoZW1lc0FmdGVyRW50cnkSEwoGYXV0aG9yGAogASgJSAKIAQESGAoLZGVzY3JpcHRpb24YCyABKAlIA4gBARIUCgx0aW1lc3RhbXBfbXMYDCABKAQSMgoFc3RhdGUYDSABKA4yIy5hcmNoZWdseXBoLnN0eWxlLnYxLlN0eWxlRWRpdFN0YXRlEhgKC3Jldmlld2VkX2J5GA4gASgJSASIAQESGwoOcmV2aWV3ZWRfYXRfbXMYDyABKARIBYgBARI3CgZ0aHJlYWQYECABKAsyIi5hcmNoZWdseXBoLnN0eWxlLnYxLkNvbW1lbnRUaHJlYWRIBogBARoyChBUaGVtZXNBZnRlckVudHJ5EgsKA2tleRgBIAEoCRINCgV2YWx1ZRgCIAEoCToCOAFCDAoKX2Jhc2VfaGFzaEIPCg1fY2FudmFzX2FmdGVyQgkKB19hdXRob3JCDgoMX2Rlc2NyaXB0aW9uQg4KDF9yZXZpZXdlZF9ieUIRCg9fcmV2aWV3ZWRfYXRfbXNCCQoHX3RocmVhZCKdAgoSRWxlbWVudFN0eWxlQ2hhbmdlEhIKCmVsZW1lbnRfaWQYASABKAkSOQoLY2hhbmdlX3R5cGUYAiABKA4yJC5hcmNoZWdseXBoLnN0eWxlLnYxLlN0eWxlQ2hhbmdlVHlwZRI6CgVhZnRlchgDIAEoCzImLmFyY2hlZ2x5cGguc3R5bGUudjEuRWxlbWVudFN0eWxlRW50cnlIAIgBARITCgt1bnNldF9wYXRocxgEIAMoCRIzCgVraW5kcxgFIAMoDjIkLmFyY2hlZ2x5cGguc3R5bGUudjEuU3R5bGVDaGFuZ2VLaW5kEhgKC2Rlc2NyaXB0aW9uGAYgASgJSAGIAQFCCAoGX2FmdGVyQg4KDF9kZXNjcmlwdGlvbiKUAgoPRWRnZVN0eWxlQ2hhbmdlEg8KB2VkZ2VfaWQYASABKAkSOQoLY2hhbmdlX3R5cGUYAiABKA4yJC5hcmNoZWdseXBoLnN0eWxlLnYxLlN0eWxlQ2hhbmdlVHlwZRI3CgVhZnRlchgDIAEoCzIjLmFyY2hlZ2x5cGguc3R5bGUudjEuRWRnZVN0eWxlRW50cnlIAIgBARITCgt1bnNldF9wYXRocxgEIAMoCRIzCgVraW5kcxgFIAMoDjIkLmFyY2hlZ2x5cGguc3R5bGUudjEuU3R5bGVDaGFuZ2VLaW5kEhgKC2Rlc2NyaXB0aW9uGAYgASgJSAGIAQFCCAoGX2FmdGVyQg4KDF9kZXNjcmlwdGlvbiKhAgoVQW5ub3RhdGlvblN0eWxlQ2hhbmdlEhUKDWFubm90YXRpb25faWQYASABKAkSOQoLY2hhbmdlX3R5cGUYAiABKA4yJC5hcmNoZWdseXBoLnN0eWxlLnYxLlN0eWxlQ2hhbmdlVHlwZRI4CgVhZnRlchgDIAEoCzIkLmFyY2hlZ2x5cGguc3R5bGUudjEuQW5ub3RhdGlvbkVudHJ5SACIAQESEwoLdW5zZXRfcGF0aHMYBCADKAkSMwoFa2luZHMYBSADKA4yJC5hcmNoZWdseXBoLnN0eWxlLnYxLlN0eWxlQ2hhbmdlS2luZBIYCgtkZXNjcmlwdGlvbhgGIAEoCUgBiAEBQggKBl9hZnRlckIOCgxfZGVzY3JpcHRpb24iqwEKDUNvbW1lbnRUaHJlYWQSLgoIY29tbWVudHMYASADKAsyHC5hcmNoZWdseXBoLnN0eWxlLnYxLkNvbW1lbnQSEAoIcmVzb2x2ZWQYAiABKAgSGAoLcmVzb2x2ZWRfYnkYAyABKAlIAIgBARIbCg5yZXNvbHZlZF9hdF9tcxgEIAEoBEgBiAEBQg4KDF9yZXNvbHZlZF9ieUIRCg9fcmVzb2x2ZWRfYXRfbXMifQoHQ29tbWVudBIKCgJpZBgBIAEoCRITCgZhdXRob3IYAiABKAlIAIgBARIUCgx0aW1lc3RhbXBfbXMYAyABKAQSDAoEYm9keRgEIAEoCRIVCghyZXBseV90bxgFIAEoCUgBiAEBQgkKB19hdXRob3JCCwoJX3JlcGx5X3RvKk0KDk5vZGVWaXNpYmlsaXR5Eh8KG05PREVfVklTSUJJTElUWV9VTlNQRUNJRklFRBAAEhoKFk5PREVfVklTSUJJTElUWV9ISURERU4QASqPAQoPR3JvdXBSZW5kZXJNb2RlEiEKHUdST1VQX1JFTkRFUl9NT0RFX1VOU1BFQ0lGSUVEEAASGgoWR1JPVVBfUkVOREVSX01PREVfT1BFThABEh8KG0dST1VQX1JFTkRFUl9NT0RFX0RJU1NPTFZFRBACEhwKGEdST1VQX1JFTkRFUl9NT0RFX0NMT1NFRBADKnwKC0VkZ2VSb3V0aW5nEhcKE1JPVVRJTkdfVU5TUEVDSUZJRUQQABIUChBST1VUSU5HX1NUUkFJR0hUEAESFgoSUk9VVElOR19PUlRIT0dPTkFMEAISEgoOUk9VVElOR19DVVJWRUQQAxISCg5ST1VUSU5HX01BTlVBTBAEKpUBChBFZGdlUGF0aFBvc2l0aW9uEh0KGVBBVEhfUE9TSVRJT05fVU5TUEVDSUZJRUQQABIXChNQQVRIX1BPU0lUSU9OX1NUQVJUEAESGAoUUEFUSF9QT1NJVElPTl9NSURETEUQAhIVChFQQVRIX1BPU0lUSU9OX0VORBADEhgKFFBBVEhfUE9TSVRJT05fQ1VTVE9NEAQq3AEKEkdyb3VwTGFiZWxQb3NpdGlvbhIbChdHUk9VUF9MQUJFTF9VTlNQRUNJRklFRBAAEhgKFEdST1VQX0xBQkVMX1RPUF9MRUZUEAESGgoWR1JPVVBfTEFCRUxfVE9QX0NFTlRFUhACEhkKFUdST1VQX0xBQkVMX1RPUF9SSUdIVBADEhsKF0dST1VQX0xBQkVMX0JPVFRPTV9MRUZUEAQSHQoZR1JPVVBfTEFCRUxfQk9UVE9NX0NFTlRFUhAFEhwKGEdST1VQX0xBQkVMX0JPVFRPTV9SSUdIVBAGKuEBCglTaGFwZVR5cGUSFQoRU0hBUEVfVU5TUEVDSUZJRUQQABISCg5TSEFQRV9UUklBTkdMRRABEg4KClNIQVBFX1JFQ1QQAhISCg5TSEFQRV9QRU5UQUdPThADEhEKDVNIQVBFX0hFWEFHT04QBBISCg5TSEFQRV9IRVBUQUdPThAFEhEKDVNIQVBFX09DVEFHT04QBhIRCg1TSEFQRV9OT05BR09OEAcSEQoNU0hBUEVfREVDQUdPThAIEhEKDVNIQVBFX0VMTElQU0UQCRISCg5TSEFQRV9DWUxJTkRFUhAKKswBCg1TdHJva2VQYXR0ZXJuEh4KGlNUUk9LRV9QQVRURVJOX1VOU1BFQ0lGSUVEEAASGAoUU1RST0tFX1BBVFRFUk5fU09MSUQQARIZChVTVFJPS0VfUEFUVEVSTl9EQVNIRUQQAhIZChVTVFJPS0VfUEFUVEVSTl9ET1RURUQQAxIXChNTVFJPS0VfUEFUVEVSTl9QTFVTEAQSGAoUU1RST0tFX1BBVFRFUk5fTUlOVVMQBRIYChRTVFJPS0VfUEFUVEVSTl9ERUxUQRAGKk0KCVN0cm9rZUNhcBITCg9DQVBfVU5TUEVDSUZJRUQQABIMCghDQVBfQlVUVBABEg0KCUNBUF9ST1VORBACEg4KCkNBUF9TUVVBUkUQAypSCgpTdHJva2VKb2luEhQKEEpPSU5fVU5TUEVDSUZJRUQQABIOCgpKT0lOX01JVEVSEAESDgoKSk9JTl9ST1VORBACEg4KCkpPSU5fQkVWRUwQAypSCgxHcmFkaWVudFR5cGUSGAoUR1JBRElFTlRfVU5TUEVDSUZJRUQQABITCg9HUkFESUVOVF9MSU5FQVIQARITCg9HUkFESUVOVF9SQURJQUwQAiqCAQoKRm9udFdlaWdodBIWChJXRUlHSFRfVU5TUEVDSUZJRUQQABIQCgxXRUlHSFRfTElHSFQQARIRCg1XRUlHSFRfTk9STUFMEAISEQoNV0VJR0hUX01FRElVTRADEhMKD1dFSUdIVF9TRU1JQk9MRBAEEg8KC1dFSUdIVF9CT0xEEAUqVQoJVGV4dEFsaWduEhUKEUFMSUdOX1VOU1BFQ0lGSUVEEAASEAoMQUxJR05fQ0VOVEVSEAESDgoKQUxJR05fTEVGVBACEg8KC0FMSUdOX1JJR0hUEAMqqwEKEEFycm93aGVhZFZhcmlhbnQSGQoVQVJST1dIRUFEX1VOU1BFQ0lGSUVEEAASEgoOQVJST1dIRUFEX05PTkUQARISCg5BUlJPV0hFQURfT1BFThACEhQKEEFSUk9XSEVBRF9GSUxMRUQQAxIVChFBUlJPV0hFQURfRElBTU9ORBAEEhQKEEFSUk9XSEVBRF9DSVJDTEUQBRIRCg1BUlJPV0hFQURfVEVFEAYqVwoORGVjb3JhdGlvbktpbmQSGgoWREVDT1JBVElPTl9VTlNQRUNJRklFRBAAEhQKEERFQ09SQVRJT05fQkFER0UQARITCg9ERUNPUkFUSU9OX0lDT04QAipMCgdSZWZLaW5kEhgKFFJFRl9LSU5EX1VOU1BFQ0lGSUVEEAASFAoQUkVGX0tJTkRfRUxFTUVOVBABEhEKDVJFRl9LSU5EX0VER0UQAiqQAQoPU3R5bGVDaGFuZ2VUeXBlEiEKHVNUWUxFX0NIQU5HRV9UWVBFX1VOU1BFQ0lGSUVEEAASGwoXU1RZTEVfQ0hBTkdFX1RZUEVfQURERUQQARIdChlTVFlMRV9DSEFOR0VfVFlQRV9ERUxFVEVEEAISHgoaU1RZTEVfQ0hBTkdFX1RZUEVfTU9ESUZJRUQQAyqwAgoPU3R5bGVDaGFuZ2VLaW5kEiEKHVNUWUxFX0NIQU5HRV9LSU5EX1VOU1BFQ0lGSUVEEAASHAoYU1RZTEVfQ0hBTkdFX0tJTkRfTEFZT1VUEAESGwoXU1RZTEVfQ0hBTkdFX0tJTkRfU0hBUEUQAhIgChxTVFlMRV9DSEFOR0VfS0lORF9DT05ORUNUSU9OEAMSIAocU1RZTEVfQ0hBTkdFX0tJTkRfVFlQT0dSQVBIWRAEEh0KGVNUWUxFX0NIQU5HRV9LSU5EX0NBTExPVVQQBRIfChtTVFlMRV9DSEFOR0VfS0lORF9DT01QT05FTlQQBhIcChhTVFlMRV9DSEFOR0VfS0lORF9BTkNIT1IQBxIdChlTVFlMRV9DSEFOR0VfS0lORF9DT05URU5UEAgqjQEKDlN0eWxlRWRpdFN0YXRlEiAKHFNUWUxFX0VESVRfU1RBVEVfVU5TUEVDSUZJRUQQABIcChhTVFlMRV9FRElUX1NUQVRFX1BFTkRJTkcQARIcChhTVFlMRV9FRElUX1NUQVRFX0FQUExJRUQQAhIdChlTVFlMRV9FRElUX1NUQVRFX1JFSkVDVEVEEANiBnByb3RvMw", [file_content]);
var StylesheetSchema = /* @__PURE__ */ messageDesc(file_style, 0);
var CanvasStyleSchema = /* @__PURE__ */ messageDesc(file_style, 1);
var ElementStyleEntrySchema = /* @__PURE__ */ messageDesc(file_style, 2);
var EdgeStyleEntrySchema = /* @__PURE__ */ messageDesc(file_style, 3);
var BoxLayoutSchema = /* @__PURE__ */ messageDesc(file_style, 6);
var Glyph2DSchema = /* @__PURE__ */ messageDesc(file_style, 8);
var Glyph1DSchema = /* @__PURE__ */ messageDesc(file_style, 9);
var TypographySchema = /* @__PURE__ */ messageDesc(file_style, 10);
var StrokeSchema = /* @__PURE__ */ messageDesc(file_style, 11);
var FillSchema = /* @__PURE__ */ messageDesc(file_style, 12);
var GlowSchema = /* @__PURE__ */ messageDesc(file_style, 15);
var ArrowheadsSchema = /* @__PURE__ */ messageDesc(file_style, 16);
var Vec2Schema = /* @__PURE__ */ messageDesc(file_style, 18);
var ColorSchema = /* @__PURE__ */ messageDesc(file_style, 19);
var AnnotationEntrySchema = /* @__PURE__ */ messageDesc(file_style, 20);

// packages/proto/src/gen/theme_pb.ts
var file_theme = /* @__PURE__ */ fileDesc("Cgt0aGVtZS5wcm90bxITYXJjaGVnbHlwaC50aGVtZS52MSK1BQoFVGhlbWUSFgoOc2NoZW1hX3ZlcnNpb24YASABKA0SDAoEbmFtZRgCIAEoCRIYCgtkZXNjcmlwdGlvbhgDIAEoCUgAiAEBEhQKB2V4dGVuZHMYBCABKAlIAYgBARIrCgZ0b2tlbnMYBSABKAsyGy5hcmNoZWdseXBoLnRoZW1lLnYxLlRva2VucxI7Cg9ub2RlX2NvbXBvbmVudHMYBiADKAsyIi5hcmNoZWdseXBoLnRoZW1lLnYxLk5vZGVDb21wb25lbnQSOwoPZWRnZV9jb21wb25lbnRzGAcgAygLMiIuYXJjaGVnbHlwaC50aGVtZS52MS5FZGdlQ29tcG9uZW50EjwKEGdyb3VwX2NvbXBvbmVudHMYCCADKAsyIi5hcmNoZWdseXBoLnRoZW1lLnYxLk5vZGVDb21wb25lbnQSRwoVYW5ub3RhdGlvbl9jb21wb25lbnRzGAkgAygLMiguYXJjaGVnbHlwaC50aGVtZS52MS5Bbm5vdGF0aW9uQ29tcG9uZW50EiMKFmRlZmF1bHRfbm9kZV9jb21wb25lbnQYCiABKAlIAogBARIjChZkZWZhdWx0X2VkZ2VfY29tcG9uZW50GAsgASgJSAOIAQESJAoXZGVmYXVsdF9ncm91cF9jb21wb25lbnQYDCABKAlIBIgBARIpChxkZWZhdWx0X2Fubm90YXRpb25fY29tcG9uZW50GA0gASgJSAWIAQFCDgoMX2Rlc2NyaXB0aW9uQgoKCF9leHRlbmRzQhkKF19kZWZhdWx0X25vZGVfY29tcG9uZW50QhkKF19kZWZhdWx0X2VkZ2VfY29tcG9uZW50QhoKGF9kZWZhdWx0X2dyb3VwX2NvbXBvbmVudEIfCh1fZGVmYXVsdF9hbm5vdGF0aW9uX2NvbXBvbmVudCKiAQoNTm9kZUNvbXBvbmVudBIMCgRuYW1lGAEgASgJEjAKBXNoYXBlGAIgASgLMhwuYXJjaGVnbHlwaC5zdHlsZS52MS5HbHlwaDJESACIAQESOAoKdHlwb2dyYXBoeRgDIAEoCzIfLmFyY2hlZ2x5cGguc3R5bGUudjEuVHlwb2dyYXBoeUgBiAEBQggKBl9zaGFwZUINCgtfdHlwb2dyYXBoeSKsAQoNRWRnZUNvbXBvbmVudBIMCgRuYW1lGAEgASgJEjUKCmNvbm5lY3Rpb24YAiABKAsyHC5hcmNoZWdseXBoLnN0eWxlLnYxLkdseXBoMURIAIgBARI4Cgp0eXBvZ3JhcGh5GAMgASgLMh8uYXJjaGVnbHlwaC5zdHlsZS52MS5UeXBvZ3JhcGh5SAGIAQFCDQoLX2Nvbm5lY3Rpb25CDQoLX3R5cG9ncmFwaHki6AEKE0Fubm90YXRpb25Db21wb25lbnQSDAoEbmFtZRgBIAEoCRIwCgVzaGFwZRgCIAEoCzIcLmFyY2hlZ2x5cGguc3R5bGUudjEuR2x5cGgyREgAiAEBEjgKCnR5cG9ncmFwaHkYAyABKAsyHy5hcmNoZWdseXBoLnN0eWxlLnYxLlR5cG9ncmFwaHlIAYgBARIyCgdjYWxsb3V0GAQgASgLMhwuYXJjaGVnbHlwaC5zdHlsZS52MS5HbHlwaDFESAKIAQFCCAoGX3NoYXBlQg0KC190eXBvZ3JhcGh5QgoKCF9jYWxsb3V0Ip4FCgZUb2tlbnMSOQoHcGFsZXR0ZRgBIAMoCzIoLmFyY2hlZ2x5cGgudGhlbWUudjEuVG9rZW5zLlBhbGV0dGVFbnRyeRI1CgVyb2xlcxgEIAMoCzImLmFyY2hlZ2x5cGgudGhlbWUudjEuVG9rZW5zLlJvbGVzRW50cnkSNQoFZm9udHMYAiADKAsyJi5hcmNoZWdseXBoLnRoZW1lLnYxLlRva2Vucy5Gb250c0VudHJ5EjUKBXNpemVzGAMgAygLMiYuYXJjaGVnbHlwaC50aGVtZS52MS5Ub2tlbnMuU2l6ZXNFbnRyeRI3CgZkYXNoZXMYBSADKAsyJy5hcmNoZWdseXBoLnRoZW1lLnYxLlRva2Vucy5EYXNoZXNFbnRyeRJACgtzaGFwZV9wYXRocxgGIAMoCzIrLmFyY2hlZ2x5cGgudGhlbWUudjEuVG9rZW5zLlNoYXBlUGF0aHNFbnRyeRouCgxQYWxldHRlRW50cnkSCwoDa2V5GAEgASgJEg0KBXZhbHVlGAIgASgJOgI4ARosCgpSb2xlc0VudHJ5EgsKA2tleRgBIAEoCRINCgV2YWx1ZRgCIAEoCToCOAEaSwoKRm9udHNFbnRyeRILCgNrZXkYASABKAkSLAoFdmFsdWUYAiABKAsyHS5hcmNoZWdseXBoLnRoZW1lLnYxLkZvbnRTcGVjOgI4ARosCgpTaXplc0VudHJ5EgsKA2tleRgBIAEoCRINCgV2YWx1ZRgCIAEoAToCOAEaLQoLRGFzaGVzRW50cnkSCwoDa2V5GAEgASgJEg0KBXZhbHVlGAIgASgJOgI4ARoxCg9TaGFwZVBhdGhzRW50cnkSCwoDa2V5GAEgASgJEg0KBXZhbHVlGAIgASgJOgI4ASJ3CghGb250U3BlYxIOCgZmYW1pbHkYASABKAkSEQoEc2l6ZRgCIAEoAUgAiAEBEjQKBndlaWdodBgDIAEoDjIfLmFyY2hlZ2x5cGguc3R5bGUudjEuRm9udFdlaWdodEgBiAEBQgcKBV9zaXplQgkKB193ZWlnaHRiBnByb3RvMw", [file_style]);
var ThemeSchema = /* @__PURE__ */ messageDesc(file_theme, 0);
var NodeComponentSchema = /* @__PURE__ */ messageDesc(file_theme, 1);
var EdgeComponentSchema = /* @__PURE__ */ messageDesc(file_theme, 2);
var AnnotationComponentSchema = /* @__PURE__ */ messageDesc(file_theme, 3);
var TokensSchema = /* @__PURE__ */ messageDesc(file_theme, 4);
var FontSpecSchema = /* @__PURE__ */ messageDesc(file_theme, 5);

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wkt/gen/google/protobuf/any_pb.js
var file_google_protobuf_any = /* @__PURE__ */ fileDesc("Chlnb29nbGUvcHJvdG9idWYvYW55LnByb3RvEg9nb29nbGUucHJvdG9idWYiJgoDQW55EhAKCHR5cGVfdXJsGAEgASgJEg0KBXZhbHVlGAIgASgMQnYKE2NvbS5nb29nbGUucHJvdG9idWZCCEFueVByb3RvUAFaLGdvb2dsZS5nb2xhbmcub3JnL3Byb3RvYnVmL3R5cGVzL2tub3duL2FueXBiogIDR1BCqgIeR29vZ2xlLlByb3RvYnVmLldlbGxLbm93blR5cGVzYgZwcm90bzM");
var AnySchema = /* @__PURE__ */ messageDesc(file_google_protobuf_any, 0);

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wkt/any.js
function anyPack(schema, message, into) {
  let ret = false;
  if (!into) {
    into = create(AnySchema);
    ret = true;
  }
  into.value = toBinary(schema, message);
  into.typeUrl = typeNameToUrl(message.$typeName);
  return ret ? into : undefined;
}
function anyIs(any, descOrTypeName) {
  if (any.typeUrl === "") {
    return false;
  }
  const want = typeof descOrTypeName == "string" ? descOrTypeName : descOrTypeName.typeName;
  const got = typeUrlToName(any.typeUrl);
  return want === got;
}
function anyUnpack(any, registryOrMessageDesc) {
  if (any.typeUrl === "") {
    return;
  }
  const desc = registryOrMessageDesc.kind == "message" ? registryOrMessageDesc : registryOrMessageDesc.getMessage(typeUrlToName(any.typeUrl));
  if (!desc || !anyIs(any, desc)) {
    return;
  }
  return fromBinary(desc, any.value);
}
function typeNameToUrl(name) {
  return `type.googleapis.com/${name}`;
}
function typeUrlToName(url) {
  const slash = url.lastIndexOf("/");
  const name = slash >= 0 ? url.substring(slash + 1) : url;
  if (!name.length) {
    throw new Error(`invalid type url: ${url}`);
  }
  return name;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/wkt/gen/google/protobuf/struct_pb.js
var file_google_protobuf_struct = /* @__PURE__ */ fileDesc("Chxnb29nbGUvcHJvdG9idWYvc3RydWN0LnByb3RvEg9nb29nbGUucHJvdG9idWYihAEKBlN0cnVjdBIzCgZmaWVsZHMYASADKAsyIy5nb29nbGUucHJvdG9idWYuU3RydWN0LkZpZWxkc0VudHJ5GkUKC0ZpZWxkc0VudHJ5EgsKA2tleRgBIAEoCRIlCgV2YWx1ZRgCIAEoCzIWLmdvb2dsZS5wcm90b2J1Zi5WYWx1ZToCOAEi6gEKBVZhbHVlEjAKCm51bGxfdmFsdWUYASABKA4yGi5nb29nbGUucHJvdG9idWYuTnVsbFZhbHVlSAASFgoMbnVtYmVyX3ZhbHVlGAIgASgBSAASFgoMc3RyaW5nX3ZhbHVlGAMgASgJSAASFAoKYm9vbF92YWx1ZRgEIAEoCEgAEi8KDHN0cnVjdF92YWx1ZRgFIAEoCzIXLmdvb2dsZS5wcm90b2J1Zi5TdHJ1Y3RIABIwCgpsaXN0X3ZhbHVlGAYgASgLMhouZ29vZ2xlLnByb3RvYnVmLkxpc3RWYWx1ZUgAQgYKBGtpbmQiMwoJTGlzdFZhbHVlEiYKBnZhbHVlcxgBIAMoCzIWLmdvb2dsZS5wcm90b2J1Zi5WYWx1ZSobCglOdWxsVmFsdWUSDgoKTlVMTF9WQUxVRRAAQn8KE2NvbS5nb29nbGUucHJvdG9idWZCC1N0cnVjdFByb3RvUAFaL2dvb2dsZS5nb2xhbmcub3JnL3Byb3RvYnVmL3R5cGVzL2tub3duL3N0cnVjdHBi+AEBogIDR1BCqgIeR29vZ2xlLlByb3RvYnVmLldlbGxLbm93blR5cGVzYgZwcm90bzM");
var StructSchema = /* @__PURE__ */ messageDesc(file_google_protobuf_struct, 0);
var ValueSchema = /* @__PURE__ */ messageDesc(file_google_protobuf_struct, 1);
var ListValueSchema = /* @__PURE__ */ messageDesc(file_google_protobuf_struct, 2);
var NullValue;
(function(NullValue2) {
  NullValue2[NullValue2["NULL_VALUE"] = 0] = "NULL_VALUE";
})(NullValue || (NullValue = {}));

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/extensions.js
function getExtension(message, extension) {
  assertExtendee(extension, message);
  const ufs = filterUnknownFields(message.$unknown, extension);
  const [container, field, get] = createExtensionContainer(extension);
  for (const uf of ufs) {
    readField(container, new BinaryReader(uf.data), field, uf.wireType, {
      readUnknownFields: true
    });
  }
  return get();
}
function setExtension(message, extension, value) {
  var _a;
  assertExtendee(extension, message);
  const ufs = ((_a = message.$unknown) !== null && _a !== undefined ? _a : []).filter((uf) => uf.no !== extension.number);
  const [container, field] = createExtensionContainer(extension, value);
  const writer = new BinaryWriter;
  writeField(writer, { writeUnknownFields: true }, container, field);
  const reader = new BinaryReader(writer.finish());
  while (reader.pos < reader.len) {
    const [no, wireType] = reader.tag();
    const data = reader.skip(wireType, no);
    ufs.push({ no, wireType, data });
  }
  message.$unknown = ufs;
}
function filterUnknownFields(unknownFields, extension) {
  if (unknownFields === undefined)
    return [];
  if (extension.fieldKind === "enum" || extension.fieldKind === "scalar") {
    for (let i = unknownFields.length - 1;i >= 0; --i) {
      if (unknownFields[i].no == extension.number) {
        return [unknownFields[i]];
      }
    }
    return [];
  }
  return unknownFields.filter((uf) => uf.no === extension.number);
}
function createExtensionContainer(extension, value) {
  const localName = extension.typeName;
  const field = Object.assign(Object.assign({}, extension), { kind: "field", parent: extension.extendee, localName });
  const desc = Object.assign(Object.assign({}, extension.extendee), { fields: [field], members: [field], oneofs: [] });
  const container = create(desc, value !== undefined ? { [localName]: value } : undefined);
  return [
    reflect(desc, container),
    field,
    () => {
      const value2 = container[localName];
      if (value2 === undefined) {
        const desc2 = extension.message;
        if (isWrapperDesc(desc2)) {
          return scalarZeroValue(desc2.fields[0].scalar, desc2.fields[0].longAsString);
        }
        return create(desc2);
      }
      return value2;
    }
  ];
}
function assertExtendee(extension, message) {
  if (extension.extendee.typeName != message.$typeName) {
    throw new Error(`extension ${extension.typeName} can only be applied to message ${extension.extendee.typeName}`);
  }
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/equals.js
function equals(schema, a, b, options) {
  if (a.$typeName != schema.typeName || b.$typeName != schema.typeName) {
    return false;
  }
  if (a === b) {
    return true;
  }
  return reflectEquals(reflect(schema, a), reflect(schema, b), options);
}
function reflectEquals(a, b, opts) {
  if (a.desc.typeName === "google.protobuf.Any" && (opts === null || opts === undefined ? undefined : opts.unpackAny) == true) {
    return anyUnpackedEquals(a.message, b.message, opts);
  }
  for (const f of a.fields) {
    if (!fieldEquals(f, a, b, opts)) {
      return false;
    }
  }
  if ((opts === null || opts === undefined ? undefined : opts.unknown) == true && !unknownEquals(a, b, opts.registry)) {
    return false;
  }
  if ((opts === null || opts === undefined ? undefined : opts.extensions) == true && !extensionsEquals(a, b, opts)) {
    return false;
  }
  return true;
}
function fieldEquals(f, a, b, opts) {
  if (!a.isSet(f) && !b.isSet(f)) {
    return true;
  }
  if (!a.isSet(f) || !b.isSet(f)) {
    return false;
  }
  switch (f.fieldKind) {
    case "scalar":
      return scalarEquals(f.scalar, a.get(f), b.get(f));
    case "enum":
      return a.get(f) === b.get(f);
    case "message":
      return reflectEquals(a.get(f), b.get(f), opts);
    case "map": {
      const mapA = a.get(f);
      const mapB = b.get(f);
      const keys = [];
      for (const k of mapA.keys()) {
        if (!mapB.has(k)) {
          return false;
        }
        keys.push(k);
      }
      for (const k of mapB.keys()) {
        if (!mapA.has(k)) {
          return false;
        }
      }
      for (const key of keys) {
        const va = mapA.get(key);
        const vb = mapB.get(key);
        if (va === vb) {
          continue;
        }
        switch (f.mapKind) {
          case "enum":
            return false;
          case "message":
            if (!reflectEquals(va, vb, opts)) {
              return false;
            }
            break;
          case "scalar":
            if (!scalarEquals(f.scalar, va, vb)) {
              return false;
            }
            break;
        }
      }
      break;
    }
    case "list": {
      const listA = a.get(f);
      const listB = b.get(f);
      if (listA.size != listB.size) {
        return false;
      }
      for (let i = 0;i < listA.size; i++) {
        const va = listA.get(i);
        const vb = listB.get(i);
        if (va === vb) {
          continue;
        }
        switch (f.listKind) {
          case "enum":
            return false;
          case "message":
            if (!reflectEquals(va, vb, opts)) {
              return false;
            }
            break;
          case "scalar":
            if (!scalarEquals(f.scalar, va, vb)) {
              return false;
            }
            break;
        }
      }
      break;
    }
  }
  return true;
}
function anyUnpackedEquals(a, b, opts) {
  if (a.typeUrl !== b.typeUrl) {
    return false;
  }
  const unpackedA = anyUnpack(a, opts.registry);
  const unpackedB = anyUnpack(b, opts.registry);
  if (unpackedA && unpackedB) {
    const schema = opts.registry.getMessage(unpackedA.$typeName);
    if (schema) {
      return equals(schema, unpackedA, unpackedB, opts);
    }
  }
  return scalarEquals(ScalarType.BYTES, a.value, b.value);
}
function unknownEquals(a, b, registry) {
  function getTrulyUnknown(msg, registry2) {
    var _a;
    const u = (_a = msg.getUnknown()) !== null && _a !== undefined ? _a : [];
    return registry2 ? u.filter((uf) => !registry2.getExtensionFor(msg.desc, uf.no)) : u;
  }
  const unknownA = getTrulyUnknown(a, registry);
  const unknownB = getTrulyUnknown(b, registry);
  if (unknownA.length != unknownB.length) {
    return false;
  }
  for (let i = 0;i < unknownA.length; i++) {
    const a2 = unknownA[i];
    const b2 = unknownB[i];
    if (a2.no != b2.no) {
      return false;
    }
    if (a2.wireType != b2.wireType) {
      return false;
    }
    if (!scalarEquals(ScalarType.BYTES, a2.data, b2.data)) {
      return false;
    }
  }
  return true;
}
function extensionsEquals(a, b, opts) {
  function getSetExtensions(msg, registry) {
    var _a;
    return ((_a = msg.getUnknown()) !== null && _a !== undefined ? _a : []).map((uf) => registry.getExtensionFor(msg.desc, uf.no)).filter((e) => e != null).filter((e, index, arr) => arr.indexOf(e) === index);
  }
  const extensionsA = getSetExtensions(a, opts.registry);
  const extensionsB = getSetExtensions(b, opts.registry);
  if (extensionsA.length != extensionsB.length || extensionsA.some((e) => !extensionsB.includes(e))) {
    return false;
  }
  for (const extension of extensionsA) {
    const [containerA, field] = createExtensionContainer(extension, getExtension(a.message, extension));
    const [containerB] = createExtensionContainer(extension, getExtension(b.message, extension));
    if (!fieldEquals(field, containerA, containerB, opts)) {
      return false;
    }
  }
  return true;
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/to-json.js
var LEGACY_REQUIRED3 = 3;
var IMPLICIT4 = 2;
var jsonWriteDefaults = {
  alwaysEmitImplicit: false,
  enumAsInteger: false,
  useProtoFieldName: false
};
function makeWriteOptions2(options) {
  return options ? Object.assign(Object.assign({}, jsonWriteDefaults), options) : jsonWriteDefaults;
}
function toJson(schema, message, options) {
  return reflectToJson(reflect(schema, message), makeWriteOptions2(options));
}
function reflectToJson(msg, opts) {
  var _a;
  const wktJson = tryWktToJson(msg, opts);
  if (wktJson !== undefined)
    return wktJson;
  const json = {};
  for (const f of msg.sortedFields) {
    if (!msg.isSet(f)) {
      if (f.presence == LEGACY_REQUIRED3) {
        throw new Error(`cannot encode ${f} to JSON: required field not set`);
      }
      if (!opts.alwaysEmitImplicit || f.presence !== IMPLICIT4) {
        continue;
      }
    }
    const jsonValue = fieldToJson(f, msg.get(f), opts);
    if (jsonValue !== undefined) {
      json[jsonName(f, opts)] = jsonValue;
    }
  }
  if (opts.registry) {
    const tagSeen = new Set;
    for (const { no } of (_a = msg.getUnknown()) !== null && _a !== undefined ? _a : []) {
      if (!tagSeen.has(no)) {
        tagSeen.add(no);
        const extension = opts.registry.getExtensionFor(msg.desc, no);
        if (!extension) {
          continue;
        }
        const value = getExtension(msg.message, extension);
        const [container, field] = createExtensionContainer(extension, value);
        const jsonValue = fieldToJson(field, container.get(field), opts);
        if (jsonValue !== undefined) {
          json[extension.jsonName] = jsonValue;
        }
      }
    }
  }
  return json;
}
function fieldToJson(f, val, opts) {
  switch (f.fieldKind) {
    case "scalar":
      return scalarToJson(f, val);
    case "message":
      return reflectToJson(val, opts);
    case "enum":
      return enumToJsonInternal(f.enum, val, opts.enumAsInteger);
    case "list":
      return listToJson(val, opts);
    case "map":
      return mapToJson(val, opts);
  }
}
function mapToJson(map, opts) {
  const f = map.field();
  const jsonObj = {};
  switch (f.mapKind) {
    case "scalar":
      for (const [entryKey, entryValue] of map) {
        jsonObj[entryKey] = scalarToJson(f, entryValue);
      }
      break;
    case "message":
      for (const [entryKey, entryValue] of map) {
        jsonObj[entryKey] = reflectToJson(entryValue, opts);
      }
      break;
    case "enum":
      for (const [entryKey, entryValue] of map) {
        jsonObj[entryKey] = enumToJsonInternal(f.enum, entryValue, opts.enumAsInteger);
      }
      break;
  }
  return opts.alwaysEmitImplicit || map.size > 0 ? jsonObj : undefined;
}
function listToJson(list, opts) {
  const f = list.field();
  const jsonArr = [];
  switch (f.listKind) {
    case "scalar":
      for (const item of list) {
        jsonArr.push(scalarToJson(f, item));
      }
      break;
    case "enum":
      for (const item of list) {
        jsonArr.push(enumToJsonInternal(f.enum, item, opts.enumAsInteger));
      }
      break;
    case "message":
      for (const item of list) {
        jsonArr.push(reflectToJson(item, opts));
      }
      break;
  }
  return opts.alwaysEmitImplicit || jsonArr.length > 0 ? jsonArr : undefined;
}
function enumToJsonInternal(desc, value, enumAsInteger) {
  var _a;
  if (typeof value != "number") {
    throw new Error(`cannot encode ${desc} to JSON: expected number, got ${formatVal(value)}`);
  }
  if (desc.typeName == "google.protobuf.NullValue") {
    return null;
  }
  if (enumAsInteger) {
    return value;
  }
  const val = desc.value[value];
  return (_a = val === null || val === undefined ? undefined : val.name) !== null && _a !== undefined ? _a : value;
}
function scalarToJson(field, value) {
  var _a, _b, _c, _d, _e, _f;
  switch (field.scalar) {
    case ScalarType.INT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
      if (typeof value != "number") {
        throw new Error(`cannot encode ${field} to JSON: ${(_a = checkField(field, value)) === null || _a === undefined ? undefined : _a.message}`);
      }
      return value;
    case ScalarType.FLOAT:
    case ScalarType.DOUBLE:
      if (typeof value != "number") {
        throw new Error(`cannot encode ${field} to JSON: ${(_b = checkField(field, value)) === null || _b === undefined ? undefined : _b.message}`);
      }
      if (Number.isNaN(value))
        return "NaN";
      if (value === Number.POSITIVE_INFINITY)
        return "Infinity";
      if (value === Number.NEGATIVE_INFINITY)
        return "-Infinity";
      return value;
    case ScalarType.STRING:
      if (typeof value != "string") {
        throw new Error(`cannot encode ${field} to JSON: ${(_c = checkField(field, value)) === null || _c === undefined ? undefined : _c.message}`);
      }
      return value;
    case ScalarType.BOOL:
      if (typeof value != "boolean") {
        throw new Error(`cannot encode ${field} to JSON: ${(_d = checkField(field, value)) === null || _d === undefined ? undefined : _d.message}`);
      }
      return value;
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      if (typeof value == "bigint" || typeof value == "string" || typeof value == "number" && Number.isInteger(value)) {
        return value.toString();
      }
      throw new Error(`cannot encode ${field} to JSON: ${(_e = checkField(field, value)) === null || _e === undefined ? undefined : _e.message}`);
    case ScalarType.BYTES:
      if (value instanceof Uint8Array) {
        return base64Encode(value);
      }
      throw new Error(`cannot encode ${field} to JSON: ${(_f = checkField(field, value)) === null || _f === undefined ? undefined : _f.message}`);
  }
}
function jsonName(f, opts) {
  return opts.useProtoFieldName ? f.name : f.jsonName;
}
function tryWktToJson(msg, opts) {
  if (!msg.desc.typeName.startsWith("google.protobuf.")) {
    return;
  }
  switch (msg.desc.typeName) {
    case "google.protobuf.Any":
      return anyToJson(msg.message, opts);
    case "google.protobuf.Timestamp":
      return timestampToJson(msg.message);
    case "google.protobuf.Duration":
      return durationToJson(msg.message);
    case "google.protobuf.FieldMask":
      return fieldMaskToJson(msg.message);
    case "google.protobuf.Struct":
      return structToJson(msg.message);
    case "google.protobuf.Value":
      return valueToJson(msg.message);
    case "google.protobuf.ListValue":
      return listValueToJson(msg.message);
    default:
      if (isWrapperDesc(msg.desc)) {
        const valueField = msg.desc.fields[0];
        return scalarToJson(valueField, msg.get(valueField));
      }
      return;
  }
}
function anyToJson(val, opts) {
  if (val.typeUrl === "") {
    return {};
  }
  const { registry } = opts;
  let message;
  let desc;
  if (registry) {
    message = anyUnpack(val, registry);
    if (message) {
      desc = registry.getMessage(message.$typeName);
    }
  }
  if (!desc || !message) {
    throw new Error(`cannot encode message ${val.$typeName} to JSON: "${val.typeUrl}" is not in the type registry`);
  }
  const reflected = reflect(desc, message);
  const json = hasCustomJsonRepresentation(desc) ? { value: tryWktToJson(reflected, opts) } : reflectToJson(reflected, opts);
  json["@type"] = val.typeUrl;
  return json;
}
function durationToJson(val) {
  const seconds = Number(val.seconds);
  const nanos = val.nanos;
  if (seconds > 315576000000 || seconds < -315576000000) {
    throw new Error(`cannot encode message ${val.$typeName} to JSON: value out of range`);
  }
  if (seconds > 0 && nanos < 0 || seconds < 0 && nanos > 0) {
    throw new Error(`cannot encode message ${val.$typeName} to JSON: nanos sign must match seconds sign`);
  }
  let text = val.seconds.toString();
  if (nanos !== 0) {
    let nanosStr = Math.abs(nanos).toString();
    nanosStr = "0".repeat(9 - nanosStr.length) + nanosStr;
    if (nanosStr.substring(3) === "000000") {
      nanosStr = nanosStr.substring(0, 3);
    } else if (nanosStr.substring(6) === "000") {
      nanosStr = nanosStr.substring(0, 6);
    }
    text += "." + nanosStr;
    if (nanos < 0 && seconds == 0) {
      text = "-" + text;
    }
  }
  return text + "s";
}
function fieldMaskToJson(val) {
  return val.paths.map((p) => {
    if (protoSnakeCase(protoCamelCase(p)) !== p) {
      throw new Error(`cannot encode message ${val.$typeName} to JSON: lowerCamelCase of path name "${p}" is irreversible`);
    }
    return protoCamelCase(p);
  }).join(",");
}
function structToJson(val) {
  const json = {};
  for (const [k, v] of Object.entries(val.fields)) {
    json[k] = valueToJson(v);
  }
  return json;
}
function valueToJson(val) {
  switch (val.kind.case) {
    case "nullValue":
      return null;
    case "numberValue":
      if (!Number.isFinite(val.kind.value)) {
        throw new Error(`${val.$typeName} cannot be NaN or Infinity`);
      }
      return val.kind.value;
    case "boolValue":
      return val.kind.value;
    case "stringValue":
      return val.kind.value;
    case "structValue":
      return structToJson(val.kind.value);
    case "listValue":
      return listValueToJson(val.kind.value);
    default:
      throw new Error(`${val.$typeName} must have a value`);
  }
}
function listValueToJson(val) {
  return val.values.map(valueToJson);
}
function timestampToJson(val) {
  const ms = Number(val.seconds) * 1000;
  if (ms < Date.parse("0001-01-01T00:00:00Z") || ms > Date.parse("9999-12-31T23:59:59Z")) {
    throw new Error(`cannot encode message ${val.$typeName} to JSON: must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive`);
  }
  if (val.nanos < 0) {
    throw new Error(`cannot encode message ${val.$typeName} to JSON: nanos must not be negative`);
  }
  if (val.nanos > 999999999) {
    throw new Error(`cannot encode message ${val.$typeName} to JSON: nanos must not be greater than 99999999`);
  }
  let z = "Z";
  if (val.nanos > 0) {
    const nanosStr = (val.nanos + 1e9).toString().substring(1);
    if (nanosStr.substring(3) === "000000") {
      z = "." + nanosStr.substring(0, 3) + "Z";
    } else if (nanosStr.substring(6) === "000") {
      z = "." + nanosStr.substring(0, 6) + "Z";
    } else {
      z = "." + nanosStr + "Z";
    }
  }
  return new Date(ms).toISOString().replace(".000Z", z);
}

// node_modules/.bun/@bufbuild+protobuf@2.12.0/node_modules/@bufbuild/protobuf/dist/esm/from-json.js
var jsonReadDefaults = {
  ignoreUnknownFields: false
};
function makeReadOptions2(options) {
  return options ? Object.assign(Object.assign({}, jsonReadDefaults), options) : jsonReadDefaults;
}
function fromJson(schema, json, options) {
  const msg = reflect(schema);
  try {
    readMessage2(msg, json, makeReadOptions2(options));
  } catch (e) {
    if (isFieldError(e)) {
      throw new Error(`cannot decode ${e.field()} from JSON: ${e.message}`, {
        cause: e
      });
    }
    throw e;
  }
  return msg.message;
}
var messageJsonFields = new WeakMap;
function getJsonField(desc, jsonKey) {
  var _a;
  if (!messageJsonFields.has(desc)) {
    const jsonNames = new Map;
    for (const field of desc.fields) {
      jsonNames.set(field.name, field).set(field.jsonName, field);
    }
    messageJsonFields.set(desc, jsonNames);
  }
  return (_a = messageJsonFields.get(desc)) === null || _a === undefined ? undefined : _a.get(jsonKey);
}
function readMessage2(msg, json, opts) {
  var _a;
  if (tryWktFromJson(msg, json, opts)) {
    return;
  }
  if (json == null || Array.isArray(json) || typeof json != "object") {
    throw new Error(`cannot decode ${msg.desc} from JSON: ${formatVal(json)}`);
  }
  const oneofSeen = new Map;
  for (const [jsonKey, jsonValue] of Object.entries(json)) {
    const field = getJsonField(msg.desc, jsonKey);
    if (field) {
      if (field.oneof) {
        if (jsonValue === null && field.fieldKind == "scalar") {
          continue;
        }
        const seen = oneofSeen.get(field.oneof);
        if (seen !== undefined) {
          throw new FieldError(field.oneof, `oneof set multiple times by ${seen.name} and ${field.name}`);
        }
        oneofSeen.set(field.oneof, field);
      }
      readField2(msg, field, jsonValue, opts);
    } else {
      let extension = undefined;
      if (jsonKey.startsWith("[") && jsonKey.endsWith("]") && (extension = (_a = opts.registry) === null || _a === undefined ? undefined : _a.getExtension(jsonKey.substring(1, jsonKey.length - 1))) && extension.extendee.typeName === msg.desc.typeName) {
        const [container, field2, get] = createExtensionContainer(extension);
        readField2(container, field2, jsonValue, opts);
        setExtension(msg.message, extension, get());
      }
      if (!extension && !opts.ignoreUnknownFields) {
        throw new Error(`cannot decode ${msg.desc} from JSON: key "${jsonKey}" is unknown`);
      }
    }
  }
}
function readField2(msg, field, json, opts) {
  switch (field.fieldKind) {
    case "scalar":
      readScalarField(msg, field, json);
      break;
    case "enum":
      readEnumField(msg, field, json, opts);
      break;
    case "message":
      readMessageField2(msg, field, json, opts);
      break;
    case "list":
      readListField2(msg.get(field), json, opts);
      break;
    case "map":
      readMapField(msg.get(field), json, opts);
      break;
  }
}
function readListOrMapItem(field, json, opts) {
  if (field.scalar && json !== null) {
    return scalarFromJson(field, json);
  }
  if (field.message && !isResetSentinelNullValue(field, json)) {
    const msgValue = reflect(field.message);
    readMessage2(msgValue, json, opts);
    return msgValue;
  }
  if (field.enum && !isResetSentinelNullValue(field, json)) {
    return readEnum(field.enum, json, opts.ignoreUnknownFields);
  }
  throw new FieldError(field, `${field.fieldKind === "list" ? "list item" : "map value"} must not be null`);
}
function readMapField(map, json, opts) {
  if (json === null) {
    return;
  }
  const field = map.field();
  if (typeof json != "object" || Array.isArray(json)) {
    throw new FieldError(field, "expected object, got " + formatVal(json));
  }
  for (const [jsonMapKey, jsonMapValue] of Object.entries(json)) {
    const key = mapKeyFromJson(field.mapKey, jsonMapKey);
    const value = readListOrMapItem(field, jsonMapValue, opts);
    if (value !== tokenIgnoredUnknownEnum) {
      map.set(key, value);
    }
  }
}
function readListField2(list, json, opts) {
  if (json === null) {
    return;
  }
  const field = list.field();
  if (!Array.isArray(json)) {
    throw new FieldError(field, "expected Array, got " + formatVal(json));
  }
  for (const jsonItem of json) {
    const value = readListOrMapItem(field, jsonItem, opts);
    if (value !== tokenIgnoredUnknownEnum) {
      list.add(value);
    }
  }
}
function readMessageField2(msg, field, json, opts) {
  if (isResetSentinelNullValue(field, json)) {
    msg.clear(field);
    return;
  }
  const msgValue = msg.isSet(field) ? msg.get(field) : reflect(field.message);
  readMessage2(msgValue, json, opts);
  msg.set(field, msgValue);
}
function readEnumField(msg, field, json, opts) {
  if (isResetSentinelNullValue(field, json)) {
    msg.clear(field);
    return;
  }
  const enumValue = readEnum(field.enum, json, opts.ignoreUnknownFields);
  if (enumValue !== tokenIgnoredUnknownEnum) {
    msg.set(field, enumValue);
  }
}
function readScalarField(msg, field, json) {
  if (json === null) {
    msg.clear(field);
  } else {
    msg.set(field, scalarFromJson(field, json));
  }
}
function isResetSentinelNullValue(field, json) {
  var _a, _b;
  return json === null && ((_a = field.message) === null || _a === undefined ? undefined : _a.typeName) != "google.protobuf.Value" && ((_b = field.enum) === null || _b === undefined ? undefined : _b.typeName) != "google.protobuf.NullValue";
}
var tokenIgnoredUnknownEnum = Symbol();
function readEnum(desc, json, ignoreUnknownFields) {
  if (json === null) {
    return desc.values[0].number;
  }
  switch (typeof json) {
    case "number":
      if (Number.isInteger(json)) {
        return json;
      }
      break;
    case "string":
      const value = desc.values.find((ev) => ev.name === json);
      if (value !== undefined) {
        return value.number;
      }
      if (ignoreUnknownFields) {
        return tokenIgnoredUnknownEnum;
      }
      break;
  }
  throw new Error(`cannot decode ${desc} from JSON: ${formatVal(json)}`);
}
function scalarFromJson(field, json) {
  switch (field.scalar) {
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
      if (json === "NaN")
        return NaN;
      if (json === "Infinity")
        return Number.POSITIVE_INFINITY;
      if (json === "-Infinity")
        return Number.NEGATIVE_INFINITY;
      if (typeof json == "number") {
        if (Number.isNaN(json)) {
          throw new FieldError(field, "unexpected NaN number");
        }
        if (!Number.isFinite(json)) {
          throw new FieldError(field, "unexpected infinite number");
        }
        break;
      }
      if (typeof json == "string") {
        if (json === "") {
          break;
        }
        if (json.trim().length !== json.length) {
          break;
        }
        const float = Number(json);
        if (!Number.isFinite(float)) {
          break;
        }
        return float;
      }
      break;
    case ScalarType.INT32:
    case ScalarType.FIXED32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
    case ScalarType.UINT32:
      return int32FromJson(json);
    case ScalarType.BYTES:
      if (typeof json == "string") {
        if (json === "") {
          return new Uint8Array(0);
        }
        try {
          return base64Decode(json);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          throw new FieldError(field, message);
        }
      }
      break;
  }
  return json;
}
function mapKeyFromJson(type, jsonString) {
  switch (type) {
    case ScalarType.BOOL:
      switch (jsonString) {
        case "true":
          return true;
        case "false":
          return false;
      }
      return jsonString;
    case ScalarType.INT32:
    case ScalarType.FIXED32:
    case ScalarType.UINT32:
    case ScalarType.SFIXED32:
    case ScalarType.SINT32:
      return int32FromJson(jsonString);
    default:
      return jsonString;
  }
}
function int32FromJson(json) {
  if (typeof json == "string") {
    if (json === "") {
      return json;
    }
    if (json.trim().length !== json.length) {
      return json;
    }
    const num = Number(json);
    if (Number.isNaN(num)) {
      return json;
    }
    return num;
  }
  return json;
}
function tryWktFromJson(msg, jsonValue, opts) {
  if (!msg.desc.typeName.startsWith("google.protobuf.")) {
    return false;
  }
  switch (msg.desc.typeName) {
    case "google.protobuf.Any":
      anyFromJson(msg.message, jsonValue, opts);
      return true;
    case "google.protobuf.Timestamp":
      timestampFromJson(msg.message, jsonValue);
      return true;
    case "google.protobuf.Duration":
      durationFromJson(msg.message, jsonValue);
      return true;
    case "google.protobuf.FieldMask":
      fieldMaskFromJson(msg.message, jsonValue);
      return true;
    case "google.protobuf.Struct":
      structFromJson(msg.message, jsonValue);
      return true;
    case "google.protobuf.Value":
      valueFromJson(msg.message, jsonValue);
      return true;
    case "google.protobuf.ListValue":
      listValueFromJson(msg.message, jsonValue);
      return true;
    default:
      if (isWrapperDesc(msg.desc)) {
        const valueField = msg.desc.fields[0];
        if (jsonValue === null) {
          msg.clear(valueField);
        } else {
          msg.set(valueField, scalarFromJson(valueField, jsonValue));
        }
        return true;
      }
      return false;
  }
}
function anyFromJson(any, json, opts) {
  var _a;
  if (json === null || Array.isArray(json) || typeof json != "object") {
    throw new Error(`cannot decode message ${any.$typeName} from JSON: expected object but got ${formatVal(json)}`);
  }
  if (Object.keys(json).length == 0) {
    return;
  }
  const typeUrl = json["@type"];
  if (typeof typeUrl != "string" || typeUrl == "") {
    throw new Error(`cannot decode message ${any.$typeName} from JSON: "@type" is empty`);
  }
  const typeName = typeUrl.includes("/") ? typeUrl.substring(typeUrl.lastIndexOf("/") + 1) : typeUrl;
  if (!typeName.length) {
    throw new Error(`cannot decode message ${any.$typeName} from JSON: "@type" is invalid`);
  }
  const desc = (_a = opts.registry) === null || _a === undefined ? undefined : _a.getMessage(typeName);
  if (!desc) {
    throw new Error(`cannot decode message ${any.$typeName} from JSON: ${typeUrl} is not in the type registry`);
  }
  const msg = reflect(desc);
  if (hasCustomJsonRepresentation(desc) && Object.prototype.hasOwnProperty.call(json, "value")) {
    const value = json.value;
    readMessage2(msg, value, opts);
  } else {
    const copy = Object.assign({}, json);
    delete copy["@type"];
    readMessage2(msg, copy, opts);
  }
  anyPack(msg.desc, msg.message, any);
}
function timestampFromJson(timestamp, json) {
  if (typeof json !== "string") {
    throw new Error(`cannot decode message ${timestamp.$typeName} from JSON: ${formatVal(json)}`);
  }
  const matches = json.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,9}))?(?:Z|([+-][0-9][0-9]:[0-9][0-9]))$/);
  if (!matches) {
    throw new Error(`cannot decode message ${timestamp.$typeName} from JSON: invalid RFC 3339 string`);
  }
  const ms = Date.parse(matches[1] + "-" + matches[2] + "-" + matches[3] + "T" + matches[4] + ":" + matches[5] + ":" + matches[6] + (matches[8] ? matches[8] : "Z"));
  if (Number.isNaN(ms)) {
    throw new Error(`cannot decode message ${timestamp.$typeName} from JSON: invalid RFC 3339 string`);
  }
  if (ms < Date.parse("0001-01-01T00:00:00Z") || ms > Date.parse("9999-12-31T23:59:59Z")) {
    throw new Error(`cannot decode message ${timestamp.$typeName} from JSON: must be from 0001-01-01T00:00:00Z to 9999-12-31T23:59:59Z inclusive`);
  }
  timestamp.seconds = protoInt64.parse(ms / 1000);
  timestamp.nanos = 0;
  if (matches[7]) {
    timestamp.nanos = parseInt("1" + matches[7] + "0".repeat(9 - matches[7].length)) - 1e9;
  }
}
function durationFromJson(duration, json) {
  if (typeof json !== "string") {
    throw new Error(`cannot decode message ${duration.$typeName} from JSON: ${formatVal(json)}`);
  }
  const match = json.match(/^(-?[0-9]+)(?:\.([0-9]+))?s/);
  if (match === null) {
    throw new Error(`cannot decode message ${duration.$typeName} from JSON: ${formatVal(json)}`);
  }
  const longSeconds = Number(match[1]);
  if (longSeconds > 315576000000 || longSeconds < -315576000000) {
    throw new Error(`cannot decode message ${duration.$typeName} from JSON: ${formatVal(json)}`);
  }
  duration.seconds = protoInt64.parse(longSeconds);
  if (typeof match[2] !== "string") {
    return;
  }
  const nanosStr = match[2] + "0".repeat(9 - match[2].length);
  duration.nanos = parseInt(nanosStr);
  if (longSeconds < 0 || Object.is(longSeconds, -0)) {
    duration.nanos = -duration.nanos;
  }
}
function fieldMaskFromJson(fieldMask, json) {
  if (typeof json !== "string") {
    throw new Error(`cannot decode message ${fieldMask.$typeName} from JSON: ${formatVal(json)}`);
  }
  if (json === "") {
    return;
  }
  fieldMask.paths = json.split(",").map((path) => {
    if (path.includes("_")) {
      throw new Error(`cannot decode message ${fieldMask.$typeName} from JSON: path names must be lowerCamelCase`);
    }
    return protoSnakeCase(path);
  });
}
function structFromJson(struct, json) {
  if (typeof json != "object" || json == null || Array.isArray(json)) {
    throw new Error(`cannot decode message ${struct.$typeName} from JSON ${formatVal(json)}`);
  }
  for (const [k, v] of Object.entries(json)) {
    const parsedV = create(ValueSchema);
    valueFromJson(parsedV, v);
    struct.fields[k] = parsedV;
  }
}
function valueFromJson(value, json) {
  switch (typeof json) {
    case "number":
      value.kind = { case: "numberValue", value: json };
      break;
    case "string":
      value.kind = { case: "stringValue", value: json };
      break;
    case "boolean":
      value.kind = { case: "boolValue", value: json };
      break;
    case "object":
      if (json === null) {
        value.kind = { case: "nullValue", value: NullValue.NULL_VALUE };
      } else if (Array.isArray(json)) {
        const listValue = create(ListValueSchema);
        listValueFromJson(listValue, json);
        value.kind = { case: "listValue", value: listValue };
      } else {
        const struct = create(StructSchema);
        structFromJson(struct, json);
        value.kind = { case: "structValue", value: struct };
      }
      break;
    default:
      throw new Error(`cannot decode message ${value.$typeName} from JSON ${formatVal(json)}`);
  }
  return value;
}
function listValueFromJson(listValue, json) {
  if (!Array.isArray(json)) {
    throw new Error(`cannot decode message ${listValue.$typeName} from JSON ${formatVal(json)}`);
  }
  for (const e of json) {
    const value = create(ValueSchema);
    valueFromJson(value, e);
    listValue.values.push(value);
  }
}

// packages/proto/src/util/json.ts
function fromJson2(schema, text) {
  return fromJson(schema, JSON.parse(text));
}
function toJson2(schema, message) {
  return JSON.stringify(toJson(schema, message), null, 2);
}

// packages/proto/src/schema_version.ts
var CONTENT_SCHEMA_VERSION = 2;
var STYLE_SCHEMA_VERSION = 2;

// packages/core/src/loaders/impl_loader/impl.ts
class LoaderImpl {
  async loadDiagram(request) {
    const diagram = fromJson2(DiagramSchema, request.text);
    if (diagram.schemaVersion !== CONTENT_SCHEMA_VERSION) {
      throw new Error(`loadDiagram: unsupported schema_version ${diagram.schemaVersion} (expected ${CONTENT_SCHEMA_VERSION})`);
    }
    return diagram;
  }
  async loadStylesheet(request) {
    const stylesheet = fromJson2(StylesheetSchema, request.text);
    if (stylesheet.schemaVersion !== STYLE_SCHEMA_VERSION) {
      throw new Error(`loadStylesheet: unsupported schema_version ${stylesheet.schemaVersion} (expected ${STYLE_SCHEMA_VERSION})`);
    }
    for (const edit of stylesheet.pendingEdits) {
      if (edit.schemaVersion !== STYLE_SCHEMA_VERSION) {
        throw new Error(`loadStylesheet: pending edit '${edit.id}' has unsupported schema_version ${edit.schemaVersion} (expected ${STYLE_SCHEMA_VERSION})`);
      }
    }
    return stylesheet;
  }
  async loadDelta(request) {
    const delta = fromJson2(DeltaSchema, request.text);
    if (delta.schemaVersion !== CONTENT_SCHEMA_VERSION) {
      throw new Error(`loadDelta: unsupported schema_version ${delta.schemaVersion} (expected ${CONTENT_SCHEMA_VERSION})`);
    }
    return delta;
  }
  async loadTheme(request) {
    const theme = fromJson2(ThemeSchema, request.text);
    if (theme.schemaVersion !== 1) {
      throw new Error(`loadTheme: unsupported schema_version ${theme.schemaVersion} (expected 1)`);
    }
    return theme;
  }
}
// packages/core/src/loaders/index.ts
var loader = new LoaderImpl;
async function loadDiagram(text) {
  try {
    const request = { text };
    const diagram = await loader.loadDiagram(request);
    return Ok(diagram);
  } catch (e) {
    return Err({ message: e.message });
  }
}
async function loadStylesheet(text) {
  try {
    const request = { text };
    const stylesheet = await loader.loadStylesheet(request);
    return Ok(stylesheet);
  } catch (e) {
    return Err({ message: e.message });
  }
}
async function loadDelta(text) {
  try {
    const request = { text };
    const delta = await loader.loadDelta(request);
    return Ok(delta);
  } catch (e) {
    return Err({ message: e.message });
  }
}
async function loadTheme(text) {
  try {
    const request = { text };
    const theme = await loader.loadTheme(request);
    return Ok(theme);
  } catch (e) {
    return Err({ message: e.message });
  }
}

// packages/core/src/pipeline/pipeline_error.ts
class PipelineError {
  stage;
  detail;
}
// packages/core/src/resolver/cascade_request/impl.ts
class CascadeRequest {
  filtered;
  stylesheet;
  themes;
}
// packages/core/src/resolver/filter_request/impl.ts
class FilterRequest {
  diagram;
  stylesheet;
}
// packages/core/src/resolver/resolve_tokens_request/impl.ts
class ResolveTokensRequest {
  resolved;
  tokens;
}
// packages/core/src/resolver/resolve_error/impl.ts
class ResolveError {
  message;
}
// packages/core/src/resolver/seed_bindings/derive.ts
function deriveComponent(kind, componentNames, themeDefault) {
  if (themeDefault === undefined || themeDefault === "") {
    return;
  }
  if (kind !== undefined && kind !== "" && componentNames.includes(kind)) {
    return kind;
  }
  return themeDefault;
}

// packages/core/src/resolver/resolved_annotation/impl.ts
class ResolvedAnnotation {
  id;
  anchor;
  shape;
  typography;
  callout;
  layout;
  content = [];
}
// packages/core/src/resolver/resolved_diagram/impl.ts
class ResolvedDiagram {
  id;
  canvas;
  nodes = {};
  edges = {};
  groups = {};
  annotations = {};
}
// packages/core/src/resolver/resolved_edge/impl.ts
class ResolvedEdge {
  id;
  source;
  target;
  connection;
  typography;
  layout;
  label = [];
}
// packages/core/src/resolver/resolved_group/impl.ts
class ResolvedGroup {
  id;
  parentGroup;
  viewRole = "box";
  shape;
  typography;
  layout;
  rotation;
  label = [];
  isSuperNode;
  hiddenDescendantCount;
}
// packages/core/src/resolver/resolved_node/impl.ts
class ResolvedNode {
  id;
  parentGroup;
  shape;
  typography;
  layout;
  label = [];
}
// packages/proto/src/util/init.ts
function init(target, source) {
  return Object.assign(target, source);
}

// packages/core/src/resolver/style_cascade/impl.ts
function compareIds(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
}
function mergeStroke(base, layer) {
  if (layer.paint.case !== undefined) {
    base.paint = layer.paint;
  }
  if (layer.width !== undefined) {
    base.width = layer.width;
  }
  if (layer.dashing.case !== undefined) {
    base.dashing = layer.dashing;
  }
  if (layer.cap !== undefined) {
    base.cap = layer.cap;
  }
  if (layer.join !== undefined) {
    base.join = layer.join;
  }
}
function mergeFill(base, layer) {
  if (layer.paint.case !== undefined) {
    base.paint = layer.paint;
  }
  if (layer.opacity !== undefined) {
    base.opacity = layer.opacity;
  }
}
function mergeGlow(base, layer) {
  if (layer.color !== undefined) {
    base.color = layer.color;
  }
  if (layer.radius !== undefined) {
    base.radius = layer.radius;
  }
  if (layer.intensity !== undefined) {
    base.intensity = layer.intensity;
  }
}
function mergeGlyph2D(base, layer) {
  if (layer.shapeKind.case !== undefined) {
    base.shapeKind = layer.shapeKind;
  }
  if (layer.cornerRadius !== undefined) {
    base.cornerRadius = layer.cornerRadius;
  }
  if (layer.stroke !== undefined) {
    if (base.stroke === undefined) {
      base.stroke = create(StrokeSchema);
    }
    mergeStroke(base.stroke, layer.stroke);
  }
  if (layer.fill !== undefined) {
    if (base.fill === undefined) {
      base.fill = create(FillSchema);
    }
    mergeFill(base.fill, layer.fill);
  }
  if (layer.glow !== undefined) {
    if (base.glow === undefined) {
      base.glow = create(GlowSchema);
    }
    mergeGlow(base.glow, layer.glow);
  }
  if (layer.decorations.length > 0) {
    base.decorations = layer.decorations.slice();
  }
}
function mergeGlyph1D(base, layer) {
  if (layer.stroke !== undefined) {
    if (base.stroke === undefined) {
      base.stroke = create(StrokeSchema);
    }
    mergeStroke(base.stroke, layer.stroke);
  }
  if (layer.arrowheads !== undefined) {
    base.arrowheads = layer.arrowheads;
  }
  if (layer.glow !== undefined) {
    if (base.glow === undefined) {
      base.glow = create(GlowSchema);
    }
    mergeGlow(base.glow, layer.glow);
  }
}
function mergeTypography(base, layer) {
  if (layer.font !== undefined) {
    base.font = layer.font;
  }
  if (layer.color !== undefined) {
    base.color = layer.color;
  }
  if (layer.size !== undefined) {
    base.size = layer.size;
  }
  if (layer.weight !== undefined) {
    base.weight = layer.weight;
  }
  if (layer.align !== undefined) {
    base.align = layer.align;
  }
  if (layer.visible !== undefined) {
    base.visible = layer.visible;
  }
  if (layer.background !== undefined) {
    base.background = layer.background;
  }
}
function splitQualified(name) {
  const dot = name.indexOf(".");
  return dot < 0 ? { theme: "default", component: name } : { theme: name.slice(0, dot), component: name.slice(dot + 1) };
}
function findComponent(themes, qualified, pick) {
  const { theme: themeName, component } = splitQualified(qualified);
  const theme = themes?.get(themeName);
  if (theme === undefined) {
    return { error: `no theme bound to '${themeName}'` };
  }
  const found = pick(theme, component);
  return found === undefined ? { error: `component '${component}' not found in theme '${themeName}'` } : { found };
}
var pickNode = (t, n) => t.nodeComponents.find((c) => c.name === n);
var pickEdge = (t, n) => t.edgeComponents.find((c) => c.name === n);
var pickGroup = (t, n) => t.groupComponents.find((c) => c.name === n);
var pickAnnotation = (t, n) => t.annotationComponents.find((c) => c.name === n);
function componentNameFor(explicit, themeDefault) {
  if (explicit !== undefined && explicit !== "")
    return explicit;
  return themeDefault !== undefined && themeDefault !== "" ? themeDefault : undefined;
}

class StyleCascadeImpl {
  cascade(request) {
    const filtered = request.filtered;
    const stylesheet = request.stylesheet;
    const themes = request.themes;
    const canvas = create(CanvasStyleSchema, stylesheet?.canvas ?? {});
    const themeBackground = themes?.get("default")?.tokens?.roles["background"];
    if (canvas.background === undefined && themeBackground !== undefined) {
      canvas.background = create(ColorSchema, { value: themeBackground });
    }
    const result = init(new ResolvedDiagram, {
      id: filtered.id,
      canvas
    });
    const sortedNodes = Object.values(filtered.nodes);
    sortedNodes.sort((a, b) => compareIds(a.id, b.id));
    for (const node of sortedNodes) {
      const entry = stylesheet?.elements[node.id];
      const componentName = componentNameFor(entry?.component, themes?.get("default")?.defaultNodeComponent);
      let themeComponent;
      if (componentName !== undefined) {
        const looked = findComponent(themes, componentName, pickNode);
        if ("error" in looked) {
          return Err(init(new ResolveError, { message: `node ${node.id}: ${looked.error}` }));
        }
        themeComponent = looked.found;
      }
      const shape = create(Glyph2DSchema);
      if (themeComponent?.shape !== undefined) {
        mergeGlyph2D(shape, themeComponent.shape);
      }
      if (entry?.shape !== undefined) {
        mergeGlyph2D(shape, entry.shape);
      }
      const typography = create(TypographySchema);
      if (themeComponent?.typography !== undefined) {
        mergeTypography(typography, themeComponent.typography);
      }
      if (entry?.typography !== undefined) {
        mergeTypography(typography, entry.typography);
      }
      const resolved = init(new ResolvedNode, {
        id: node.id,
        parentGroup: node.parentGroup,
        shape,
        typography,
        layout: entry?.layout,
        label: node.label
      });
      result.nodes[node.id] = resolved;
    }
    const sortedEdges = Object.values(filtered.edges);
    sortedEdges.sort((a, b) => compareIds(a.id, b.id));
    for (const edge of sortedEdges) {
      const entry = stylesheet?.edges[edge.id];
      const defaultTheme = themes?.get("default");
      const bundleComponent = entry === undefined && edge.id.startsWith("bundle:") ? deriveComponent(edge.tags.get("kind"), defaultTheme?.edgeComponents.map((component) => component.name) ?? [], defaultTheme?.defaultEdgeComponent) : undefined;
      const componentName = componentNameFor(entry?.component ?? bundleComponent, defaultTheme?.defaultEdgeComponent);
      let themeComponent;
      if (componentName !== undefined) {
        const looked = findComponent(themes, componentName, pickEdge);
        if ("error" in looked) {
          return Err(init(new ResolveError, { message: `edge ${edge.id}: ${looked.error}` }));
        }
        themeComponent = looked.found;
      }
      const connection = create(Glyph1DSchema);
      if (themeComponent?.connection !== undefined) {
        mergeGlyph1D(connection, themeComponent.connection);
      }
      if (entry?.connection !== undefined) {
        mergeGlyph1D(connection, entry.connection);
      }
      const typography = create(TypographySchema);
      if (themeComponent?.typography !== undefined) {
        mergeTypography(typography, themeComponent.typography);
      }
      if (entry?.typography !== undefined) {
        mergeTypography(typography, entry.typography);
      }
      const resolved = init(new ResolvedEdge, {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        connection,
        typography,
        layout: entry?.layout,
        label: edge.label
      });
      result.edges[edge.id] = resolved;
    }
    const sortedGroups = Object.values(filtered.groups);
    sortedGroups.sort((a, b) => compareIds(a.id, b.id));
    for (const group of sortedGroups) {
      const entry = stylesheet?.elements[group.id];
      const asBlock = group.isSuperNode;
      const componentName = asBlock ? componentNameFor(entry?.component, themes?.get("default")?.defaultNodeComponent) : componentNameFor(entry?.boxComponent, themes?.get("default")?.defaultGroupComponent);
      let themeComponent;
      if (componentName !== undefined) {
        const looked = findComponent(themes, componentName, asBlock ? pickNode : pickGroup);
        if ("error" in looked) {
          return Err(init(new ResolveError, { message: `group ${group.id}: ${looked.error}` }));
        }
        themeComponent = looked.found;
      }
      const glyph = asBlock ? entry?.shape : entry?.box;
      const shape = create(Glyph2DSchema);
      if (themeComponent?.shape !== undefined) {
        mergeGlyph2D(shape, themeComponent.shape);
      }
      if (glyph !== undefined) {
        mergeGlyph2D(shape, glyph);
      }
      const typography = create(TypographySchema);
      if (themeComponent?.typography !== undefined) {
        mergeTypography(typography, themeComponent.typography);
      }
      if (entry?.typography !== undefined) {
        mergeTypography(typography, entry.typography);
      }
      const blockLayout = asBlock ? entry?.layout : undefined;
      const resolved = init(new ResolvedGroup, {
        id: group.id,
        parentGroup: group.parentGroup,
        viewRole: group.viewRole,
        shape,
        typography,
        layout: asBlock && blockLayout !== undefined ? create(BoxLayoutSchema, { position: blockLayout.position, size: blockLayout.size }) : asBlock ? undefined : entry?.boxLayout,
        rotation: blockLayout?.rotation,
        label: group.label,
        isSuperNode: group.isSuperNode,
        hiddenDescendantCount: group.hiddenDescendantCount
      });
      result.groups[group.id] = resolved;
    }
    const sortedAnnotations = Object.values(filtered.annotations);
    sortedAnnotations.sort((a, b) => compareIds(a.id, b.id));
    for (const annotation of sortedAnnotations) {
      const entry = annotation.entry;
      const componentName = componentNameFor(entry.component, themes?.get("default")?.defaultAnnotationComponent);
      let themeComponent;
      if (componentName !== undefined) {
        const looked = findComponent(themes, componentName, pickAnnotation);
        if ("error" in looked) {
          return Err(init(new ResolveError, { message: `annotation ${annotation.id}: ${looked.error}` }));
        }
        themeComponent = looked.found;
      }
      const shape = create(Glyph2DSchema);
      if (themeComponent?.shape !== undefined) {
        mergeGlyph2D(shape, themeComponent.shape);
      }
      if (entry.shape !== undefined) {
        mergeGlyph2D(shape, entry.shape);
      }
      const typography = create(TypographySchema);
      if (themeComponent?.typography !== undefined) {
        mergeTypography(typography, themeComponent.typography);
      }
      if (entry.typography !== undefined) {
        mergeTypography(typography, entry.typography);
      }
      const callout = create(Glyph1DSchema);
      if (entry.anchor !== undefined) {
        if (themeComponent?.callout !== undefined) {
          mergeGlyph1D(callout, themeComponent.callout);
        }
        if (entry.callout !== undefined) {
          mergeGlyph1D(callout, entry.callout);
        }
      }
      const resolved = init(new ResolvedAnnotation, {
        id: annotation.id,
        anchor: entry.anchor,
        shape,
        typography,
        callout,
        layout: entry.layout,
        content: entry.content
      });
      result.annotations[annotation.id] = resolved;
    }
    return Ok(result);
  }
}
// packages/core/src/resolver/token_resolver/impl.ts
var TOKEN_REF_RE = /^\$[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
var PALETTE_REF_RE = /^\$palette\.([a-zA-Z_][a-zA-Z0-9_]*)$/;

class TokenResolverImpl {
  resolveTokens(request) {
    const resolved = request.resolved;
    if (resolved === undefined) {
      return Err({ message: "resolveTokens: request.resolved is required" });
    }
    const tokens = request.tokens;
    if (tokens === undefined) {
      return Ok(resolved);
    }
    const unresolved = [];
    walk(resolved, tokens, unresolved);
    walk(resolved.canvas, tokens, unresolved);
    if (unresolved.length > 0) {
      const listed = [...new Set(unresolved)].sort().join(", ");
      return Err({ message: `unresolved token reference(s): ${listed}` });
    }
    return Ok(resolved);
  }
}
function resolveTokensIn(obj, tokens) {
  const unresolved = [];
  walk(obj, tokens, unresolved);
  return unresolved;
}
function walk(obj, tokens, unresolved) {
  if (obj === null || obj === undefined)
    return;
  if (typeof obj !== "object")
    return;
  if (Array.isArray(obj)) {
    for (let i = 0;i < obj.length; i++) {
      const v = obj[i];
      if (typeof v === "string") {
        obj[i] = resolveRef(v, tokens, unresolved);
      } else {
        walk(v, tokens, unresolved);
      }
    }
    return;
  }
  const record = obj;
  for (const key of Object.keys(record)) {
    if (key === "$typeName" || key === "$unknown")
      continue;
    const v = record[key];
    if (typeof v === "string") {
      record[key] = resolveRef(v, tokens, unresolved);
    } else {
      walk(v, tokens, unresolved);
    }
  }
}
function resolveRef(value, tokens, unresolved) {
  if (!TOKEN_REF_RE.test(value))
    return value;
  const dot = value.indexOf(".");
  if (dot < 0)
    return value;
  const looked = lookup(tokens, value.substring(1, dot), value.substring(dot + 1));
  if (looked === undefined) {
    unresolved.push(value);
    return value;
  }
  if (typeof looked === "number")
    return String(looked);
  return looked;
}
function lookup(tokens, table, key) {
  switch (table) {
    case "roles": {
      const role = tokens.roles[key];
      if (role === undefined)
        return;
      const hop = PALETTE_REF_RE.exec(role);
      return hop === null ? role : tokens.palette[hop[1]];
    }
    case "palette":
      return tokens.palette[key];
    case "fonts":
      return tokens.fonts[key]?.family;
    case "sizes":
      return tokens.sizes[key];
    case "dashes":
      return tokens.dashes[key];
    case "shape_paths":
      return tokens.shapePaths[key];
    default:
      return;
  }
}
// packages/core/src/resolver/filtered_annotation/impl.ts
class FilteredAnnotation {
  id;
  entry;
}
// packages/core/src/resolver/filtered_diagram/impl.ts
class FilteredDiagram {
  id;
  nodes = {};
  edges = {};
  groups = {};
  annotations = {};
}
// packages/core/src/resolver/filtered_edge/impl.ts
class FilteredEdge {
  id;
  source;
  target;
  ordinal;
  tags;
  label = [];
}
// packages/core/src/validator/control_character/impl.ts
var CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
function hasControlCharacter(id) {
  return CONTROL_CHARACTER.test(id);
}
// packages/core/src/resolver/element_form/impl.ts
function childrenIndex(elements) {
  const children = new Map;
  for (const id of Object.keys(elements).sort()) {
    const parent = elements[id].parent;
    if (parent === undefined || parent === "") {
      continue;
    }
    const list = children.get(parent);
    if (list === undefined) {
      children.set(parent, [id]);
    } else {
      list.push(id);
    }
  }
  return children;
}
function isGroupLike(elements, children, id) {
  return (children.get(id)?.length ?? 0) > 0 || elements[id].role === 2 /* GROUPING */;
}
// packages/core/src/resolver/filtered_group/impl.ts
class FilteredGroup {
  id;
  parentGroup;
  viewRole = "box";
  tags;
  label = [];
  isSuperNode;
  hiddenDescendantCount;
  internalEdgeCount = 0;
}
// packages/core/src/resolver/filtered_node/impl.ts
class FilteredNode {
  id;
  parentGroup;
  tags;
  label = [];
}
// packages/core/src/resolver/effective_mode/impl.ts
function effectiveMode(id, elements, parentOf, stylesheet) {
  const entry = stylesheet?.elements[id];
  if (entry?.renderMode !== undefined && entry.renderMode !== 0 /* UNSPECIFIED */) {
    return entry.renderMode;
  }
  const depth = stylesheet?.openDepth;
  if (depth === undefined) {
    return 1 /* OPEN */;
  }
  let entityDepth = 0;
  let parent = parentOf.get(id);
  while (parent !== undefined) {
    const ancestor = elements[parent];
    if (ancestor !== undefined && ancestor.role !== 2 /* GROUPING */) {
      entityDepth += 1;
    }
    parent = parentOf.get(parent);
  }
  const grouping = elements[id].role === 2 /* GROUPING */;
  return (grouping ? entityDepth < depth : entityDepth + 1 < depth) ? 1 /* OPEN */ : 3 /* CLOSED */;
}
// packages/core/src/resolver/representative/impl.ts
function representative(id, closed, parentOf) {
  let result = id;
  let parent = parentOf.get(id);
  while (parent !== undefined) {
    if (closed.has(parent)) {
      result = parent;
    }
    parent = parentOf.get(parent);
  }
  return result;
}
// packages/core/src/resolver/visibility_filter/impl.ts
function bundleHash(edge) {
  const label = edge.label.map((l) => [l.locale, l.source]);
  const text = JSON.stringify([edge.tags.get("kind") ?? null, label]);
  let h = 2166136261;
  for (let i = 0;i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function bundleKey(edge) {
  const label = edge.label.map((l) => [l.locale, l.source]);
  return JSON.stringify([edge.source, edge.target, edge.tags.get("kind") ?? null, label]);
}

class VisibilityFilterImpl {
  filter(request) {
    const diagram = request.diagram;
    const stylesheet = request.stylesheet;
    const elementsMap = diagram.graph !== undefined ? diagram.graph.elements : {};
    const edgesMap = diagram.graph !== undefined ? diagram.graph.edges : {};
    const children = childrenIndex(elementsMap);
    const nodesMap = {};
    const groupsMap = {};
    for (const id of Object.keys(elementsMap).sort()) {
      if (isGroupLike(elementsMap, children, id)) {
        groupsMap[id] = elementsMap[id];
      } else {
        nodesMap[id] = elementsMap[id];
      }
    }
    const sortedKeys = (obj) => Object.keys(obj).sort();
    for (const [label, ids] of [["element", elementsMap], ["edge", edgesMap]]) {
      for (const id of sortedKeys(ids)) {
        if (hasControlCharacter(id)) {
          const err = new ResolveError;
          err.message = `visibility_filter: ${label} id ${JSON.stringify(id)} contains a control character`;
          return Err(err);
        }
      }
    }
    const parentOf = new Map;
    for (const id of sortedKeys(elementsMap)) {
      const parent = elementsMap[id].parent;
      if (parent !== undefined && parent !== "") {
        if (elementsMap[parent] === undefined) {
          const err = new ResolveError;
          err.message = `visibility_filter: element '${id}' references unknown parent '${parent}'`;
          return Err(err);
        }
        parentOf.set(id, parent);
      }
    }
    for (const id of sortedKeys(elementsMap)) {
      const seen = new Set([id]);
      let ancestor = parentOf.get(id);
      while (ancestor !== undefined) {
        if (seen.has(ancestor)) {
          const err = new ResolveError;
          err.message = `visibility_filter: element '${id}' is in a parent cycle through '${ancestor}'`;
          return Err(err);
        }
        seen.add(ancestor);
        ancestor = parentOf.get(ancestor);
      }
    }
    const hiddenNodeIds = new Set;
    if (stylesheet !== undefined) {
      const styleElementIds = sortedKeys(stylesheet.elements);
      for (const id of styleElementIds) {
        const entry = stylesheet.elements[id];
        if (entry.visibility === 1 /* HIDDEN */) {
          hiddenNodeIds.add(id);
        } else {}
      }
    } else {}
    for (const id of sortedKeys(elementsMap)) {
      let current = id;
      while (current !== undefined) {
        if (hiddenNodeIds.has(current)) {
          hiddenNodeIds.add(id);
          break;
        }
        current = parentOf.get(current);
      }
    }
    if (stylesheet !== undefined) {
      for (const id of sortedKeys(stylesheet.elements)) {
        const element = elementsMap[id];
        if (element !== undefined && stylesheet.elements[id].renderMode === 2 /* DISSOLVED */ && element.role !== 2 /* GROUPING */) {
          const err = new ResolveError;
          err.message = `visibility_filter: element '${id}' is dissolved but is not grouping`;
          return Err(err);
        }
      }
    }
    const dissolvedGroupIds = new Set;
    const closedGroupIds = new Set;
    const sortedGroupIds = sortedKeys(groupsMap);
    for (const id of sortedGroupIds) {
      const mode = effectiveMode(id, elementsMap, parentOf, stylesheet);
      if (mode === 2 /* DISSOLVED */) {
        dissolvedGroupIds.add(id);
      } else if (mode === 3 /* CLOSED */) {
        closedGroupIds.add(id);
      } else {}
    }
    for (const id of sortedKeys(edgesMap)) {
      const edge = edgesMap[id];
      for (const endpoint of [edge.source, edge.target]) {
        if (elementsMap[endpoint] === undefined) {
          const err = new ResolveError;
          err.message = `visibility_filter: edge '${id}' references unknown element '${endpoint}'`;
          return Err(err);
        }
      }
      if (elementsMap[edge.source]?.role === 2 /* GROUPING */ || elementsMap[edge.target]?.role === 2 /* GROUPING */) {
        const err = new ResolveError;
        const endpoint = elementsMap[edge.source]?.role === 2 /* GROUPING */ ? edge.source : edge.target;
        err.message = `visibility_filter: edge '${id}' endpoint '${endpoint}' is grouping`;
        return Err(err);
      }
    }
    const normParent = (raw) => {
      if (raw === undefined || raw === "") {
        return;
      } else {
        return raw;
      }
    };
    const sortedNodeIds = sortedKeys(nodesMap);
    const liftThroughExpanded = (rawParent) => {
      let p = rawParent;
      while (p !== undefined && dissolvedGroupIds.has(p)) {
        p = parentOf.get(p);
      }
      return p;
    };
    const closedRoot = new Map;
    for (const id of sortedKeys(elementsMap)) {
      const root = representative(id, closedGroupIds, parentOf);
      if (root !== id) {
        closedRoot.set(id, root);
      }
    }
    const hiddenDescendantCount = new Map;
    for (const cid of sortedGroupIds) {
      if (closedGroupIds.has(cid)) {
        hiddenDescendantCount.set(cid, 0);
      } else {}
    }
    for (const root of closedRoot.values()) {
      const prev = hiddenDescendantCount.get(root);
      const next = prev !== undefined ? prev + 1 : 1;
      hiddenDescendantCount.set(root, next);
    }
    const toTagMap = (tags) => {
      const m = new Map;
      const keys = Object.keys(tags).sort();
      for (const k of keys) {
        m.set(k, tags[k]);
      }
      return m;
    };
    const filteredNodes = [];
    for (const id of sortedNodeIds) {
      if (hiddenNodeIds.has(id)) {} else if (closedRoot.has(id)) {} else {
        const node = nodesMap[id];
        const fn = new FilteredNode;
        fn.id = id;
        fn.parentGroup = liftThroughExpanded(normParent(node.parent));
        fn.tags = toTagMap(node.tags);
        fn.label = node.label;
        filteredNodes.push(fn);
      }
    }
    const filteredGroups = [];
    for (const id of sortedGroupIds) {
      if (hiddenNodeIds.has(id)) {} else if (dissolvedGroupIds.has(id)) {} else if (closedRoot.has(id)) {} else {
        const group = groupsMap[id];
        const fg = new FilteredGroup;
        fg.id = id;
        fg.parentGroup = liftThroughExpanded(normParent(group.parent));
        fg.viewRole = closedGroupIds.has(id) ? "block" : "box";
        fg.tags = toTagMap(group.tags);
        fg.label = group.label;
        fg.isSuperNode = closedGroupIds.has(id);
        const count = hiddenDescendantCount.get(id);
        fg.hiddenDescendantCount = count !== undefined ? count : 0;
        filteredGroups.push(fg);
      }
    }
    const filteredEdges = [];
    const remappedEdgeIds = new Set;
    const sortedEdgeIds = sortedKeys(edgesMap);
    const shownKinds = new Set(stylesheet?.shownEdgeKinds ?? []);
    for (const id of sortedEdgeIds) {
      const edge = edgesMap[id];
      if (shownKinds.size > 0 && !shownKinds.has(edge.tags["kind"] ?? "")) {
        continue;
      }
      const srcHidden = hiddenNodeIds.has(edge.source);
      const tgtHidden = hiddenNodeIds.has(edge.target);
      if (srcHidden || tgtHidden) {} else {
        const sRoot = closedRoot.get(edge.source);
        const tRoot = closedRoot.get(edge.target);
        const source = sRoot !== undefined ? sRoot : edge.source;
        const target = tRoot !== undefined ? tRoot : edge.target;
        if (source === target && (source !== edge.source || target !== edge.target)) {
          const group = filteredGroups.find((candidate) => candidate.id === source);
          if (group !== undefined) {
            group.internalEdgeCount += 1;
          }
          continue;
        }
        const fe = new FilteredEdge;
        fe.id = id;
        fe.source = source;
        fe.target = target;
        fe.ordinal = edge.ordinal;
        fe.tags = toTagMap(edge.tags);
        fe.label = edge.label;
        if (sRoot !== undefined || tRoot !== undefined) {
          remappedEdgeIds.add(id);
        }
        filteredEdges.push(fe);
      }
    }
    const bundledEdges = [];
    const pairIndex = new Map;
    const pairOrder = [];
    for (const fe of filteredEdges) {
      if (!remappedEdgeIds.has(fe.id)) {
        bundledEdges.push(fe);
        continue;
      }
      const pairKey = bundleKey(fe);
      const existing = pairIndex.get(pairKey);
      if (existing === undefined) {
        pairIndex.set(pairKey, [fe]);
        pairOrder.push(pairKey);
      } else {
        existing.push(fe);
      }
    }
    for (const pairKey of pairOrder) {
      const group = pairIndex.get(pairKey);
      if (group.length === 1) {
        bundledEdges.push(group[0]);
        continue;
      }
      const first = group[0];
      const kind = first.tags.get("kind");
      const merged = new FilteredEdge;
      merged.id = `bundle:${first.source}__${first.target}__${bundleHash(first)}`;
      merged.source = first.source;
      merged.target = first.target;
      merged.ordinal = Math.min(...group.map((e) => e.ordinal));
      merged.tags = new Map([["archeglyph.bundled", String(group.length)]]);
      if (kind !== undefined) {
        merged.tags.set("kind", kind);
      }
      merged.label = first.label.length > 0 ? first.label.map((l) => create(LocalizationSchema, { locale: l.locale, source: `${l.source} ×${group.length}` })) : [create(LocalizationSchema, { locale: "en", source: `×${group.length}` })];
      bundledEdges.push(merged);
    }
    filteredEdges.length = 0;
    filteredEdges.push(...bundledEdges);
    const filteredAnnotations = [];
    if (stylesheet !== undefined) {
      const sortedAnnIds = sortedKeys(stylesheet.annotations);
      for (const id of sortedAnnIds) {
        const entry = stylesheet.annotations[id];
        const fa = new FilteredAnnotation;
        fa.id = id;
        fa.entry = clone(AnnotationEntrySchema, entry);
        const anchored = fa.entry.anchor?.refId;
        if (fa.entry.anchor !== undefined && fa.entry.anchor.refKind === 1 /* ELEMENT */ && anchored !== undefined && closedRoot.has(anchored)) {
          fa.entry.anchor.refId = closedRoot.get(anchored);
        }
        filteredAnnotations.push(fa);
      }
    } else {}
    const byId = (items) => Object.fromEntries(items.map((item) => [item.id, item]));
    const out = new FilteredDiagram;
    out.id = diagram.id;
    out.nodes = byId(filteredNodes);
    out.edges = byId(filteredEdges);
    out.groups = byId(filteredGroups);
    out.annotations = byId(filteredAnnotations);
    return Ok(out);
  }
}
// packages/core/src/pipeline/resolve_pipeline.ts
function resolvePipeline(diagram, stylesheet, themes) {
  const perTheme = [];
  for (const [name, theme] of themes) {
    if (theme.tokens === undefined)
      continue;
    for (const ref of resolveTokensIn(theme.nodeComponents, theme.tokens))
      perTheme.push(`${name}: ${ref}`);
    for (const ref of resolveTokensIn(theme.edgeComponents, theme.tokens))
      perTheme.push(`${name}: ${ref}`);
    for (const ref of resolveTokensIn(theme.groupComponents, theme.tokens))
      perTheme.push(`${name}: ${ref}`);
    for (const ref of resolveTokensIn(theme.annotationComponents, theme.tokens))
      perTheme.push(`${name}: ${ref}`);
  }
  if (perTheme.length > 0) {
    return Err(init(new PipelineError, { stage: "tokens", detail: `unresolved token reference(s): ${[...new Set(perTheme)].sort().join(", ")}` }));
  }
  const filterResult = new VisibilityFilterImpl().filter(init(new FilterRequest, { diagram, stylesheet }));
  if (filterResult.kind === "err") {
    return Err(init(new PipelineError, { stage: "filter", detail: filterResult.error.message }));
  }
  const cascadeResult = new StyleCascadeImpl().cascade(init(new CascadeRequest, { filtered: filterResult.value, stylesheet, themes }));
  if (cascadeResult.kind === "err") {
    return Err(init(new PipelineError, { stage: "cascade", detail: cascadeResult.error.message }));
  }
  const tokenResult = new TokenResolverImpl().resolveTokens(init(new ResolveTokensRequest, { resolved: cascadeResult.value, tokens: themes.get("default")?.tokens }));
  if (tokenResult.kind === "err") {
    return Err(init(new PipelineError, { stage: "tokens", detail: tokenResult.error.message }));
  }
  return Ok(tokenResult.value);
}
// packages/core/src/geometry/bounds/impl.ts
function boundsIntersects(a, b) {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}
function boundsFromRect(position, size) {
  const endX = position.x + size.x;
  const endY = position.y + size.y;
  return {
    minX: Math.min(position.x, endX),
    minY: Math.min(position.y, endY),
    maxX: Math.max(position.x, endX),
    maxY: Math.max(position.y, endY)
  };
}
function boundsUnion(a, b) {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY)
  };
}
function boundsCentre(b) {
  return {
    x: (b.minX + b.maxX) / 2,
    y: (b.minY + b.maxY) / 2
  };
}
function boundsProjectToEdge(b, toward) {
  const centreX = (b.minX + b.maxX) / 2;
  const centreY = (b.minY + b.maxY) / 2;
  const dx = toward.x - centreX;
  const dy = toward.y - centreY;
  if (dx === 0 && dy === 0) {
    return { x: centreX, y: centreY };
  }
  const halfWidth = (b.maxX - b.minX) / 2;
  const halfHeight = (b.maxY - b.minY) / 2;
  const xScale = dx === 0 ? Infinity : halfWidth / Math.abs(dx);
  const yScale = dy === 0 ? Infinity : halfHeight / Math.abs(dy);
  const scale = Math.min(xScale, yScale);
  return {
    x: centreX + dx * scale,
    y: centreY + dy * scale
  };
}
// packages/core/src/layout/edge_router/impl.ts
function routeStraight(sourceBounds, targetBounds, sourceAttach, targetAttach) {
  const sourceCentre = boundsCentre(sourceBounds);
  const targetCentre = boundsCentre(targetBounds);
  const start = resolveAttachPoint(sourceBounds, targetCentre, sourceAttach);
  const end = resolveAttachPoint(targetBounds, sourceCentre, targetAttach);
  return [start, end];
}
function resolveAttachPoint(bounds, towardCentre, attachHint) {
  const centre = boundsCentre(bounds);
  if (attachHint === undefined) {
    return boundsProjectToEdge(bounds, towardCentre);
  }
  const halfWidth = (bounds.maxX - bounds.minX) / 2;
  const halfHeight = (bounds.maxY - bounds.minY) / 2;
  const toward = {
    x: centre.x + attachHint.x * halfWidth,
    y: centre.y + attachHint.y * halfHeight
  };
  return boundsProjectToEdge(bounds, toward);
}
function routeOrthogonal(sourceBounds, targetBounds, sourceAttach, targetAttach) {
  const sourceCentre = boundsCentre(sourceBounds);
  const targetCentre = boundsCentre(targetBounds);
  const start = resolveAttachPoint(sourceBounds, targetCentre, sourceAttach);
  const end = resolveAttachPoint(targetBounds, sourceCentre, targetAttach);
  if (start.x === end.x || start.y === end.y) {
    return [start, end];
  }
  const bend = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y) ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
  return [start, bend, end];
}
// packages/core/src/layout/edge_section/impl.ts
class EdgeSection {
  startPoint;
  bendPoints = [];
  endPoint;
}
// packages/core/src/layout/callout_line/impl.ts
function calloutSections(diagram, annotation) {
  const anchor = annotation.anchor;
  if (anchor === undefined) {
    return [];
  }
  let targetBounds;
  if (anchor.refKind === 1 /* ELEMENT */) {
    const node = diagram.nodes[anchor.refId];
    const group = diagram.groups[anchor.refId];
    if (node !== undefined) {
      targetBounds = boundsFromRect(node.position, node.size);
    } else if (group !== undefined) {
      targetBounds = boundsFromRect(group.position, group.size);
    }
  } else if (anchor.refKind === 2 /* EDGE */) {
    const edge = diagram.edges[anchor.refId];
    if (edge === undefined || edge.sections.length === 0) {
      return [];
    }
    const points2 = [];
    for (const section of edge.sections) {
      points2.push(section.startPoint, ...section.bendPoints, section.endPoint);
    }
    targetBounds = boundsFromRect(points2[0], { x: 0, y: 0 });
    for (const point of points2.slice(1)) {
      targetBounds = boundsUnion(targetBounds, boundsFromRect(point, { x: 0, y: 0 }));
    }
  }
  if (targetBounds === undefined) {
    return [];
  }
  const annotationBounds = boundsFromRect(annotation.position, annotation.size);
  const annotationCentre = boundsCentre(annotationBounds);
  const targetCentre = boundsCentre(targetBounds);
  const start = resolveAttachPoint(annotationBounds, targetCentre);
  const end = resolveAttachPoint(targetBounds, annotationCentre, anchor.anchorPosition);
  const points = [start, end];
  return [init(new EdgeSection, {
    startPoint: points[0],
    bendPoints: [],
    endPoint: points[1]
  })];
}

// packages/core/src/renderer/render_error/impl.ts
class RenderError {
  message;
}
// packages/core/src/renderer/svg_painter/impl.ts
function r(n) {
  return n.toFixed(2);
}
var MARK_SPACING = 11;
var MARK_BOX = 9;
var GLYPH_MARKS = new Map([
  [4 /* PLUS */, '<path d="M -3,0 L 3,0 M 0,-3 L 0,3" fill="none" stroke-width="1.5"/>'],
  [5 /* MINUS */, '<path d="M -3,0 L 3,0" fill="none" stroke-width="3.2"/>'],
  [6 /* DELTA */, '<path d="M 3.1,0 L -2.3,2.7 L -2.3,-2.7 Z" stroke="none"/>']
]);
function glyphPatternOf(stroke) {
  if (stroke === undefined || stroke.dashing.case !== "pattern") {
    return;
  }
  return GLYPH_MARKS.has(stroke.dashing.value) ? stroke.dashing.value : undefined;
}
function glyphPatternId(pattern, color) {
  return `ag-glyph-${pattern}-${color.replace("#", "")}`;
}
function glyphMarker(pattern, color) {
  const mark = GLYPH_MARKS.get(pattern) ?? "";
  const half = r(MARK_BOX / 2);
  return `<marker id="${glyphPatternId(pattern, color)}" viewBox="-${half} -${half} ${r(MARK_BOX)} ${r(MARK_BOX)}" markerWidth="${r(MARK_BOX)}" markerHeight="${r(MARK_BOX)}" markerUnits="userSpaceOnUse" refX="0" refY="0" orient="auto" fill="${color}" stroke="${color}">${mark}</marker>`;
}
function glyphPatterns(keys) {
  if (keys.length === 0) {
    return "";
  }
  const defs = keys.map((key) => {
    const parts = key.split("\x00");
    return glyphMarker(Number(parts[0]), parts[1]);
  }).join("");
  return `<defs>${defs}</defs>`;
}
function subdivide(points) {
  const out = [];
  for (let i = 0;i + 1 < points.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    const span = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.round(span / MARK_SPACING));
    for (let k = 0;k < steps; k++) {
      const t = k / steps;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  const last = points[points.length - 1];
  if (last !== undefined) {
    out.push(last);
  }
  return out;
}
function glyphMarks(points, pattern, color) {
  const dense = subdivide(points);
  if (dense.length === 0) {
    return "";
  }
  const d = dense.map((pt, i) => `${i === 0 ? "M" : "L"} ${r(pt.x)},${r(pt.y)}`).join(" ");
  const id = glyphPatternId(pattern, color);
  return `<path d="${d}" fill="none" stroke="none" marker-start="url(#${id})" marker-mid="url(#${id})" marker-end="url(#${id})"/>`;
}
function outlinePoints(shape, position, size) {
  const { x, y } = position;
  const w = size.x;
  const h = size.y;
  const kind = shape.shapeKind.case === "standard" ? shape.shapeKind.value : 0 /* SHAPE_UNSPECIFIED */;
  const sides = new Map([
    [1 /* SHAPE_TRIANGLE */, 3],
    [3 /* SHAPE_PENTAGON */, 5],
    [4 /* SHAPE_HEXAGON */, 6],
    [5 /* SHAPE_HEPTAGON */, 7],
    [6 /* SHAPE_OCTAGON */, 8],
    [7 /* SHAPE_NONAGON */, 9],
    [8 /* SHAPE_DECAGON */, 10],
    [9 /* SHAPE_ELLIPSE */, 48]
  ]);
  const n = sides.get(kind);
  if (n !== undefined) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const pts = [];
    for (let k = 0;k <= n; k++) {
      const angle = 2 * Math.PI * (k % n) / n - Math.PI / 2;
      pts.push({ x: cx + w / 2 * Math.cos(angle), y: cy + h / 2 * Math.sin(angle) });
    }
    return pts;
  }
  return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y }];
}
function dashAttr(stroke) {
  if (stroke.dashing.case === "customDasharray") {
    return ` stroke-dasharray="${stroke.dashing.value}"`;
  }
  if (stroke.dashing.case === "pattern") {
    if (stroke.dashing.value === 2 /* DASHED */) {
      return ' stroke-dasharray="5,4"';
    }
    if (stroke.dashing.value === 3 /* DOTTED */) {
      return ' stroke-dasharray="1,3"';
    }
  }
  return "";
}
function strokeAttrs(stroke) {
  if (stroke === undefined) {
    return "";
  } else {
    const colorStr = stroke.paint.case === "color" ? ` stroke="${stroke.paint.value.value}"` : "";
    const widthStr = stroke.width !== undefined ? ` stroke-width="${r(stroke.width)}"` : "";
    const dash = glyphPatternOf(stroke) === undefined ? dashAttr(stroke) : "";
    return colorStr + widthStr + dash;
  }
}
function lineStrokeAttrs(stroke) {
  const color = stroke?.paint.case === "color" ? stroke.paint.value.value : "#000000";
  const width = stroke?.width ?? 1;
  const dash = stroke === undefined || glyphPatternOf(stroke) !== undefined ? "" : dashAttr(stroke);
  return ` stroke="${color}" stroke-width="${r(width)}"${dash}`;
}
function fillAttrs(fill) {
  if (fill === undefined) {
    return ' fill="none"';
  } else {
    const colorStr = fill.paint.case === "color" ? ` fill="${fill.paint.value.value}"` : "";
    const opacStr = fill.opacity !== undefined ? ` fill-opacity="${r(fill.opacity)}"` : "";
    return colorStr + opacStr;
  }
}
function polygonPoints(n, cx, cy, rx, ry) {
  let pts = "";
  for (let k = 0;k < n; k++) {
    const angle = 2 * Math.PI * k / n - Math.PI / 2;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    const sep = k > 0 ? " " : "";
    pts = pts + sep + r(px) + "," + r(py);
  }
  return pts;
}
function escapeXml(text) {
  const chars = text.split("");
  const escaped = chars.map((ch) => {
    if (ch === "&") {
      return "&amp;";
    } else if (ch === "<") {
      return "&lt;";
    } else if (ch === ">") {
      return "&gt;";
    } else if (ch === '"') {
      return "&quot;";
    } else {
      return ch;
    }
  });
  return escaped.join("");
}
function fontWeightValue(weight) {
  if (weight === 1 /* WEIGHT_LIGHT */) {
    return "300";
  } else if (weight === 2 /* WEIGHT_NORMAL */) {
    return "400";
  } else if (weight === 3 /* WEIGHT_MEDIUM */) {
    return "500";
  } else if (weight === 4 /* WEIGHT_SEMIBOLD */) {
    return "600";
  } else if (weight === 5 /* WEIGHT_BOLD */) {
    return "700";
  } else {
    return "";
  }
}
function textAnchorValue(align) {
  if (align === 1 /* ALIGN_CENTER */) {
    return "middle";
  } else if (align === 2 /* ALIGN_LEFT */) {
    return "start";
  } else if (align === 3 /* ALIGN_RIGHT */) {
    return "end";
  } else {
    return "";
  }
}
function viewBoxExtents(diagram) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of Object.values(diagram.nodes)) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + node.size.x);
    maxY = Math.max(maxY, node.position.y + node.size.y);
  }
  for (const group of Object.values(diagram.groups)) {
    minX = Math.min(minX, group.position.x);
    minY = Math.min(minY, group.position.y);
    maxX = Math.max(maxX, group.position.x + group.size.x);
    maxY = Math.max(maxY, group.position.y + group.size.y);
  }
  for (const ann of Object.values(diagram.annotations)) {
    minX = Math.min(minX, ann.position.x);
    minY = Math.min(minY, ann.position.y);
    maxX = Math.max(maxX, ann.position.x + ann.size.x);
    maxY = Math.max(maxY, ann.position.y + ann.size.y);
  }
  for (const edge of Object.values(diagram.edges)) {
    for (const section of edge.sections) {
      minX = Math.min(minX, section.startPoint.x, section.endPoint.x);
      minY = Math.min(minY, section.startPoint.y, section.endPoint.y);
      maxX = Math.max(maxX, section.startPoint.x, section.endPoint.x);
      maxY = Math.max(maxY, section.startPoint.y, section.endPoint.y);
      for (const bp of section.bendPoints) {
        minX = Math.min(minX, bp.x);
        minY = Math.min(minY, bp.y);
        maxX = Math.max(maxX, bp.x);
        maxY = Math.max(maxY, bp.y);
      }
    }
  }
  if (minX === Infinity) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }
  const pad = 16;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + 2 * pad,
    height: maxY - minY + 2 * pad
  };
}
function viewBox(diagram) {
  const extents = viewBoxExtents(diagram);
  return `${r(extents.x)} ${r(extents.y)} ${r(extents.width)} ${r(extents.height)}`;
}
function backgroundRect(diagram) {
  const background = diagram.canvas?.background;
  if (background === undefined || background.value === "") {
    return "";
  }
  const extents = viewBoxExtents(diagram);
  return `<rect x="${r(extents.x)}" y="${r(extents.y)}" width="${r(extents.width)}" height="${r(extents.height)}" fill="${escapeXml(background.value)}"/>`;
}
function arrowMarkers(variants) {
  const renderable = [...new Set(variants)].filter((v) => v !== 1 /* ARROWHEAD_NONE */);
  if (renderable.length === 0) {
    return "";
  }
  return `<defs>${renderable.map(variantMarker).join("")}</defs>`;
}
function edgePath(sections) {
  if (sections.length === 0) {
    return "";
  }
  const parts = [`M ${r(sections[0].startPoint.x)},${r(sections[0].startPoint.y)}`];
  for (const sec of sections) {
    for (const bp of sec.bendPoints) {
      parts.push(`L ${r(bp.x)},${r(bp.y)}`);
    }
    parts.push(`L ${r(sec.endPoint.x)},${r(sec.endPoint.y)}`);
  }
  return parts.join(" ");
}
function textElement(label, typography, anchor, centred = false) {
  if (label.length === 0) {
    return "";
  }
  if (typography.visible === false) {
    return "";
  }
  const entry = label[0];
  const weightStr = typography.weight !== undefined ? fontWeightValue(typography.weight) : "";
  const anchorStr = typography.align !== undefined ? textAnchorValue(typography.align) : centred ? "middle" : "";
  const fillStr = typography.color !== undefined ? typography.color.value : "";
  const attrParts = [
    `x="${r(anchor.x)}"`,
    `y="${r(anchor.y)}"`,
    typography.font !== undefined ? `font-family="${typography.font}"` : "",
    typography.size !== undefined ? `font-size="${typography.size}"` : "",
    weightStr !== "" ? `font-weight="${weightStr}"` : "",
    anchorStr !== "" ? `text-anchor="${anchorStr}"` : "",
    centred ? 'dominant-baseline="central"' : "",
    fillStr !== "" ? `fill="${fillStr}"` : ""
  ].filter((s) => s !== "");
  const attrs = attrParts.join(" ");
  const lines = entry.source.split(`
`);
  const lineHeight = typography.size !== undefined ? typography.size * 1.2 : 16;
  const tspans = lines.map((line, i) => {
    const dy = i === 0 ? "0" : `${lineHeight}`;
    return `<tspan x="${r(anchor.x)}" dy="${dy}">${escapeXml(line)}</tspan>`;
  });
  return `<text ${attrs}>${tspans.join("")}</text>`;
}
function shapePath(shape, position, size) {
  const glyph = glyphPatternOf(shape.stroke);
  const marks = glyph !== undefined && shape.stroke?.paint.case === "color" ? glyphMarks(outlinePoints(shape, position, size), glyph, shape.stroke.paint.value.value) : "";
  return shapeBody(shape, position, size) + marks;
}
function shapeBody(shape, position, size) {
  const x = position.x;
  const y = position.y;
  const w = size.x;
  const h = size.y;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const sa = strokeAttrs(shape.stroke);
  const fa = fillAttrs(shape.fill);
  if (shape.shapeKind.case === "customPathRef") {
    return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="0" data-shape-ref="${shape.shapeKind.value}"${fa}${sa}/>`;
  } else {
    const shapeType = shape.shapeKind.case === "standard" ? shape.shapeKind.value : 0 /* SHAPE_UNSPECIFIED */;
    switch (shapeType) {
      case 9 /* SHAPE_ELLIPSE */: {
        return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}"${fa}${sa}/>`;
      }
      case 10 /* SHAPE_CYLINDER */: {
        const capH = h / 5;
        const bodyY = y + capH / 2;
        const bodyH = h - capH / 2;
        return `<rect x="${r(x)}" y="${r(bodyY)}" width="${r(w)}" height="${r(bodyH)}"${fa}${sa}/><ellipse cx="${r(cx)}" cy="${r(bodyY)}" rx="${r(rx)}" ry="${r(capH / 2)}"${fa}${sa}/>`;
      }
      case 1 /* SHAPE_TRIANGLE */: {
        return `<polygon points="${polygonPoints(3, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case 3 /* SHAPE_PENTAGON */: {
        return `<polygon points="${polygonPoints(5, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case 4 /* SHAPE_HEXAGON */: {
        return `<polygon points="${polygonPoints(6, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case 5 /* SHAPE_HEPTAGON */: {
        return `<polygon points="${polygonPoints(7, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case 6 /* SHAPE_OCTAGON */: {
        return `<polygon points="${polygonPoints(8, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case 7 /* SHAPE_NONAGON */: {
        return `<polygon points="${polygonPoints(9, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case 8 /* SHAPE_DECAGON */: {
        return `<polygon points="${polygonPoints(10, cx, cy, rx, ry)}"${fa}${sa}/>`;
      }
      case 0 /* SHAPE_UNSPECIFIED */: {
        const cornerR = shape.cornerRadius !== undefined ? r(shape.cornerRadius) : "0";
        return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${cornerR}"${fa}${sa}/>`;
      }
      case 2 /* SHAPE_RECT */: {
        const cornerR = shape.cornerRadius !== undefined ? r(shape.cornerRadius) : "0";
        return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${cornerR}"${fa}${sa}/>`;
      }
      default: {
        const cornerR = shape.cornerRadius !== undefined ? r(shape.cornerRadius) : "0";
        return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${cornerR}"${fa}${sa}/>`;
      }
    }
  }
}
function variantMarker(v) {
  switch (v) {
    case 2 /* ARROWHEAD_OPEN */:
      return buildMarker("ah-open", "10", "10", "10", "5", '<path d="M0,0 L10,5 L0,10" fill="none" stroke="context-stroke" stroke-width="1.50"/>');
    case 0 /* ARROWHEAD_UNSPECIFIED */:
      return buildMarker("ah-unspecified", "10", "10", "10", "5", '<path d="M0,0 L10,5 L0,10 Z" fill="context-stroke" stroke="none"/>');
    case 3 /* ARROWHEAD_FILLED */:
      return buildMarker("ah-filled", "10", "10", "10", "5", '<path d="M0,0 L10,5 L0,10 Z" fill="context-stroke" stroke="none"/>');
    case 4 /* ARROWHEAD_DIAMOND */:
      return buildMarker("ah-diamond", "10", "10", "10", "5", '<path d="M0,5 L5,0 L10,5 L5,10 Z" fill="context-stroke" stroke="none"/>');
    case 5 /* ARROWHEAD_CIRCLE */:
      return buildMarker("ah-circle", "10", "10", "10", "5", '<circle cx="5" cy="5" r="5" fill="context-stroke" stroke="none"/>');
    case 6 /* ARROWHEAD_TEE */:
      return buildMarker("ah-tee", "2", "10", "0", "5", '<line x1="0" y1="0" x2="0" y2="10" stroke="context-stroke" stroke-width="1.50"/>');
    default:
      return "";
  }
}
function buildMarker(id, w, h, refX, refY, body) {
  return `<marker id="${id}" markerWidth="${w}" markerHeight="${h}" refX="${refX}" refY="${refY}" orient="auto">${body}</marker>`;
}
// packages/core/src/renderer/svg_renderer/impl.ts
var GROUP_LABEL_PADDING = 12;
function groupLabelPlacement(group) {
  const size = group.typography.size ?? 13;
  const ascent = size * 0.8;
  const descent = size * 0.2;
  const left = group.position.x + GROUP_LABEL_PADDING;
  const right = group.position.x + group.size.x - GROUP_LABEL_PADDING;
  const centerX = group.position.x + group.size.x / 2;
  const top = group.position.y + GROUP_LABEL_PADDING + ascent;
  const bottom = group.position.y + group.size.y - GROUP_LABEL_PADDING - descent;
  if (group.isSuperNode && group.layout?.labelPosition === undefined) {
    return {
      anchor: point(centerX, group.position.y + group.size.y / 2),
      align: 1 /* ALIGN_CENTER */
    };
  }
  switch (group.layout?.labelPosition) {
    case 2 /* GROUP_LABEL_TOP_CENTER */:
      return { anchor: point(centerX, top), align: 1 /* ALIGN_CENTER */ };
    case 3 /* GROUP_LABEL_TOP_RIGHT */:
      return { anchor: point(right, top), align: 3 /* ALIGN_RIGHT */ };
    case 4 /* GROUP_LABEL_BOTTOM_LEFT */:
      return { anchor: point(left, bottom), align: 2 /* ALIGN_LEFT */ };
    case 5 /* GROUP_LABEL_BOTTOM_CENTER */:
      return { anchor: point(centerX, bottom), align: 1 /* ALIGN_CENTER */ };
    case 6 /* GROUP_LABEL_BOTTOM_RIGHT */:
      return { anchor: point(right, bottom), align: 3 /* ALIGN_RIGHT */ };
    default:
      return { anchor: point(left, top), align: 2 /* ALIGN_LEFT */ };
  }
}
function groupLabel(group) {
  if (!group.isSuperNode || group.hiddenDescendantCount <= 0) {
    return group.label;
  }
  return group.label.map((l) => create(LocalizationSchema, { locale: l.locale, source: `${l.source} +${group.hiddenDescendantCount}` }));
}
function point(x, y) {
  return create(Vec2Schema, { x, y });
}
function markerId(variant) {
  switch (variant) {
    case 2 /* ARROWHEAD_OPEN */:
      return "ah-open";
    case 3 /* ARROWHEAD_FILLED */:
      return "ah-filled";
    case 4 /* ARROWHEAD_DIAMOND */:
      return "ah-diamond";
    case 5 /* ARROWHEAD_CIRCLE */:
      return "ah-circle";
    case 6 /* ARROWHEAD_TEE */:
      return "ah-tee";
    default:
      return "ah-unspecified";
  }
}
function sectionPoints(sections) {
  if (sections.length === 0) {
    return [];
  }
  const pts = [sections[0].startPoint];
  for (const sec of sections) {
    for (const bp of sec.bendPoints) {
      pts.push(bp);
    }
    pts.push(sec.endPoint);
  }
  return pts;
}

class SvgRendererImpl {
  render(diagram) {
    if (diagram.id === "") {
      return Err(init(new RenderError, { message: "diagram.id must not be empty" }));
    }
    const vb = viewBox(diagram);
    const vbParts = vb.split(" ");
    const svgWidth = vbParts[2];
    const svgHeight = vbParts[3];
    const sortedGroups = Object.values(diagram.groups).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const sortedNodes = Object.values(diagram.nodes).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const sortedEdges = Object.values(diagram.edges).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const sortedAnnotations = Object.values(diagram.annotations).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const variantsSeen = new Set;
    for (const edge of sortedEdges) {
      if (edge.connection.arrowheads !== undefined) {
        variantsSeen.add(edge.connection.arrowheads.start);
        variantsSeen.add(edge.connection.arrowheads.end);
      }
    }
    for (const annotation of sortedAnnotations) {
      const sections = calloutSections(diagram, annotation);
      if (sections.length > 0 && annotation.callout?.arrowheads !== undefined) {
        variantsSeen.add(annotation.callout.arrowheads.start);
        variantsSeen.add(annotation.callout.arrowheads.end);
      }
    }
    const glyphKeys = new Set;
    const noteGlyph = (stroke) => {
      const glyph = glyphPatternOf(stroke);
      if (glyph !== undefined && stroke?.paint.case === "color") {
        glyphKeys.add(`${glyph}\x00${stroke.paint.value.value}`);
      }
    };
    for (const group of sortedGroups) {
      noteGlyph(group.shape.stroke);
    }
    for (const node of sortedNodes) {
      noteGlyph(node.shape.stroke);
    }
    for (const edge of sortedEdges) {
      noteGlyph(edge.connection.stroke);
    }
    for (const annotation of sortedAnnotations) {
      noteGlyph(annotation.shape.stroke);
      noteGlyph(annotation.callout?.stroke);
    }
    const defs = arrowMarkers([...variantsSeen]) + glyphPatterns([...glyphKeys].sort());
    let groupsSvg = "";
    for (const group of sortedGroups) {
      const shape = shapePath(group.shape, group.position, group.size);
      const placement = groupLabelPlacement(group);
      const labelTypography = group.typography.align !== undefined ? group.typography : create(TypographySchema, { ...group.typography, align: placement.align });
      const labelSvg = textElement(groupLabel(group), labelTypography, placement.anchor, group.isSuperNode);
      groupsSvg += `<g id="group-${escapeXml(group.id)}" data-element-id="${escapeXml(group.id)}" data-kind="group">${shape}${labelSvg}</g>`;
    }
    let nodesSvg = "";
    for (const node of sortedNodes) {
      const shape = shapePath(node.shape, node.position, node.size);
      const centerX = node.position.x + node.size.x / 2;
      const centerY = node.position.y + node.size.y / 2;
      const center = create(Vec2Schema, { x: centerX, y: centerY });
      const labelSvg = textElement(node.label, node.typography, center, true);
      nodesSvg += `<g id="node-${escapeXml(node.id)}" data-element-id="${escapeXml(node.id)}" data-kind="node">${shape}${labelSvg}</g>`;
    }
    let edgesSvg = "";
    for (const edge of sortedEdges) {
      const d = edgePath(edge.sections);
      const startVariant = edge.connection.arrowheads?.start;
      const endVariant = edge.connection.arrowheads?.end;
      const startMarkerAttr = startVariant !== undefined && startVariant !== 1 /* ARROWHEAD_NONE */ ? ` marker-start="url(#${markerId(startVariant)})"` : "";
      const endMarkerAttr = endVariant !== undefined && endVariant !== 1 /* ARROWHEAD_NONE */ ? ` marker-end="url(#${markerId(endVariant)})"` : "";
      const hitStroke = `<path d="${d}" fill="none" stroke="transparent" stroke-width="12" style="pointer-events: stroke"/>`;
      const edgeGlyph = glyphPatternOf(edge.connection.stroke);
      const edgeMarks = edgeGlyph !== undefined && edge.connection.stroke?.paint.case === "color" ? glyphMarks(sectionPoints(edge.sections), edgeGlyph, edge.connection.stroke.paint.value.value) : "";
      const visiblePath = `<path d="${d}" fill="none"${lineStrokeAttrs(edge.connection.stroke)}${startMarkerAttr}${endMarkerAttr}/>${edgeMarks}`;
      const hasLabel = edge.label.length > 0 && edge.sections.length > 0;
      const labelSvg = hasLabel ? textElement(edge.label, edge.typography, create(Vec2Schema, {
        x: (edge.sections[0].startPoint.x + edge.sections[0].endPoint.x) / 2,
        y: (edge.sections[0].startPoint.y + edge.sections[0].endPoint.y) / 2
      }), true) : "";
      edgesSvg += `<g id="edge-${escapeXml(edge.id)}" data-element-id="${escapeXml(edge.id)}" data-kind="edge">${hitStroke}${visiblePath}${labelSvg}</g>`;
    }
    let annotationsSvg = "";
    for (const ann of sortedAnnotations) {
      const annCenter = create(Vec2Schema, {
        x: ann.position.x + ann.size.x / 2,
        y: ann.position.y + ann.size.y / 2
      });
      const calloutSectionsForAnnotation = calloutSections(diagram, ann);
      const calloutPath = edgePath(calloutSectionsForAnnotation);
      const calloutStartVariant = ann.callout?.arrowheads?.start;
      const calloutEndVariant = ann.callout?.arrowheads?.end;
      const calloutStartMarker = calloutStartVariant !== undefined && calloutStartVariant !== 1 /* ARROWHEAD_NONE */ ? ` marker-start="url(#${markerId(calloutStartVariant)})"` : "";
      const calloutEndMarker = calloutEndVariant !== undefined && calloutEndVariant !== 1 /* ARROWHEAD_NONE */ ? ` marker-end="url(#${markerId(calloutEndVariant)})"` : "";
      const calloutGlyph = glyphPatternOf(ann.callout?.stroke);
      const calloutMarks = calloutGlyph !== undefined && ann.callout?.stroke?.paint.case === "color" ? glyphMarks(sectionPoints(calloutSections(diagram, ann)), calloutGlyph, ann.callout.stroke.paint.value.value) : "";
      const calloutSvg = calloutPath !== "" ? `<path d="${calloutPath}" fill="none"${lineStrokeAttrs(ann.callout?.stroke)}${calloutStartMarker}${calloutEndMarker}/>${calloutMarks}` : "";
      const shape = shapePath(ann.shape, ann.position, ann.size);
      const labelSvg = textElement(ann.content, ann.typography, annCenter, true);
      annotationsSvg += `<g id="annotation-${escapeXml(ann.id)}" data-element-id="${escapeXml(ann.id)}" data-kind="annotation">${calloutSvg}${shape}${labelSvg}</g>`;
    }
    const svg = `<!-- archeglyph version=1 --><svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${svgWidth}" height="${svgHeight}">${defs}${backgroundRect(diagram)}${groupsSvg}${nodesSvg}${edgesSvg}${annotationsSvg}</svg>`;
    return Ok(svg);
  }
}
// packages/core/src/layout/layout_request/impl.ts
class LayoutRequest {
  diagram;
}
// packages/core/src/layout/laid_out_annotation/impl.ts
class LaidOutAnnotation {
  id;
  anchor;
  position;
  size;
  shape;
  typography;
  callout;
  layout;
  content = [];
}
// packages/core/src/layout/laid_out_diagram/impl.ts
class LaidOutDiagram {
  id;
  canvas;
  nodes = {};
  edges = {};
  groups = {};
  annotations = {};
}
// packages/core/src/layout/laid_out_edge/impl.ts
class LaidOutEdge {
  id;
  source;
  target;
  sections = [];
  connection;
  typography;
  label = [];
  layout;
}
// packages/core/src/layout/laid_out_group/impl.ts
class LaidOutGroup {
  id;
  parentGroup;
  position;
  size;
  shape;
  typography;
  label = [];
  isSuperNode;
  hiddenDescendantCount;
  layout;
}
// packages/core/src/layout/laid_out_node/impl.ts
class LaidOutNode {
  id;
  parentGroup;
  position;
  size;
  shape;
  typography;
  label = [];
  layout;
}
// packages/core/src/delta/hue.ts
function rotateHue(color, degrees) {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }
  const red = parseInt(color.slice(1, 3), 16) / 255;
  const green = parseInt(color.slice(3, 5), 16) / 255;
  const blue = parseInt(color.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  if (maximum === minimum) {
    return color.toLowerCase();
  }
  const lightness = (maximum + minimum) / 2;
  const difference = maximum - minimum;
  const saturation = lightness > 0.5 ? difference / (2 - maximum - minimum) : difference / (maximum + minimum);
  let hue;
  if (maximum === red) {
    hue = (green - blue) / difference + (green < blue ? 6 : 0);
  } else if (maximum === green) {
    hue = (blue - red) / difference + 2;
  } else {
    hue = (red - green) / difference + 4;
  }
  hue = hue * 60 + degrees;
  hue = (hue % 360 + 360) % 360;
  const hueFraction = hue / 360;
  const first = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const second = 2 * lightness - first;
  const channel = (t) => {
    let adjusted = t;
    if (adjusted < 0) {
      adjusted += 1;
    }
    if (adjusted > 1) {
      adjusted -= 1;
    }
    if (adjusted * 6 < 1) {
      return second + (first - second) * adjusted * 6;
    }
    if (adjusted * 2 < 1) {
      return first;
    }
    if (adjusted * 3 < 2) {
      return second + (first - second) * (2 / 3 - adjusted) * 6;
    }
    return second;
  };
  const rotatedRed = Math.round(channel(hueFraction + 1 / 3) * 255);
  const rotatedGreen = Math.round(channel(hueFraction) * 255);
  const rotatedBlue = Math.round(channel(hueFraction - 1 / 3) * 255);
  return `#${rotatedRed.toString(16).padStart(2, "0")}${rotatedGreen.toString(16).padStart(2, "0")}${rotatedBlue.toString(16).padStart(2, "0")}`;
}
function hueOf(color) {
  if (!/^#[0-9a-fA-F]{6}$/.test(color))
    return;
  const red = parseInt(color.slice(1, 3), 16) / 255;
  const green = parseInt(color.slice(3, 5), 16) / 255;
  const blue = parseInt(color.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const span = max - min;
  if (span === 0)
    return;
  const hue = max === red ? (green - blue) / span % 6 : max === green ? (blue - red) / span + 2 : (red - green) / span + 4;
  return (hue * 60 % 360 + 360) % 360;
}

// packages/core/src/delta/diff_color.ts
var SLOTS = [90, 180, 270];
var ADDED_TARGET = 120;
var DELETED_TARGET = 0;
function arcTo(hue, target) {
  return Math.abs(((hue - target) % 360 + 540) % 360 - 180);
}
function rotationFor(color, change) {
  const base = hueOf(color);
  if (base === undefined) {
    return SLOTS[0];
  }
  const nearest = (target, from) => from.reduce((best, slot) => arcTo(base + slot, target) < arcTo(base + best, target) ? slot : best);
  const added = nearest(ADDED_TARGET, SLOTS);
  const rest = SLOTS.filter((slot) => slot !== added);
  const deleted = nearest(DELETED_TARGET, rest);
  const modified = rest.filter((slot) => slot !== deleted)[0];
  if (change === 2 /* ADDED */)
    return added;
  if (change === 3 /* DELETED */)
    return deleted;
  return modified;
}
function diffColorFor(color, change, diffRoles) {
  if (change === 1 /* UNCHANGED */ || change === 0 /* CHANGE_TYPE_UNSPECIFIED */) {
    return color;
  }
  if (diffRoles !== undefined) {
    if (change === 2 /* ADDED */)
      return diffRoles.added;
    if (change === 4 /* MODIFIED */)
      return diffRoles.modified;
    if (change === 3 /* DELETED */)
      return diffRoles.deleted;
  }
  return rotateHue(color, rotationFor(color, change));
}

// packages/core/src/delta/diff_roles.ts
class DiffRoles {
  added;
  modified;
  deleted;
}
function resolveDiffRoles(tokens) {
  if (tokens === undefined)
    return;
  const roles = {
    added: "$roles.diff_added",
    modified: "$roles.diff_modified",
    deleted: "$roles.diff_deleted"
  };
  if (resolveTokensIn(roles, tokens).length > 0)
    return rotatedFrom(tokens);
  return init(new DiffRoles, {
    added: roles.added,
    modified: roles.modified,
    deleted: roles.deleted
  });
}
var ANCHOR = "$roles.node_outline";
function rotatedFrom(tokens) {
  const anchor = { color: ANCHOR };
  if (resolveTokensIn(anchor, tokens).length > 0)
    return;
  const color = anchor.color;
  return init(new DiffRoles, {
    added: rotateHue(color, rotationFor(color, 2 /* ADDED */)),
    modified: rotateHue(color, rotationFor(color, 4 /* MODIFIED */)),
    deleted: rotateHue(color, rotationFor(color, 3 /* DELETED */))
  });
}

// packages/core/src/delta/recolor_shape.ts
var WASH_OPACITY = 0.18;
var GLYPH_FOR_CHANGE = new Map([
  [2 /* ADDED */, 4 /* PLUS */],
  [3 /* DELETED */, 5 /* MINUS */],
  [4 /* MODIFIED */, 6 /* DELTA */]
]);
function recolorStroke(stroke, change, diffRoles, recolor) {
  const next = create(StrokeSchema, { ...stroke });
  if (recolor && stroke.paint.case === "color") {
    next.paint = {
      case: "color",
      value: { ...stroke.paint.value, value: diffColorFor(stroke.paint.value.value, change, diffRoles) }
    };
  }
  const glyph = GLYPH_FOR_CHANGE.get(change);
  if (glyph !== undefined) {
    next.dashing = { case: "pattern", value: glyph };
  }
  return next;
}
function recolorGlow(glow, change, diffRoles) {
  const next = create(GlowSchema, { ...glow });
  if (glow.color !== undefined) {
    next.color = { ...glow.color, value: diffColorFor(glow.color.value, change, diffRoles) };
  }
  return next;
}
function washFill(fill, change, diffRoles) {
  const next = create(FillSchema, { ...fill });
  if (change === 1 /* UNCHANGED */ || change === 0 /* CHANGE_TYPE_UNSPECIFIED */) {
    return next;
  }
  if (fill.paint.case === "color") {
    next.paint = {
      case: "color",
      value: { ...fill.paint.value, value: diffColorFor(fill.paint.value.value, change, diffRoles) }
    };
    next.opacity = WASH_OPACITY;
  }
  return next;
}
function recolorShape(glyph, change, diffRoles) {
  const next = create(Glyph2DSchema, { ...glyph });
  if (glyph.stroke !== undefined) {
    next.stroke = recolorStroke(glyph.stroke, change, diffRoles, false);
  }
  if (glyph.fill !== undefined) {
    next.fill = washFill(glyph.fill, change, diffRoles);
  }
  if (glyph.glow !== undefined) {
    next.glow = glyph.glow;
  }
  next.decorations = glyph.decorations;
  return next;
}
function recolorLine(glyph, change, diffRoles) {
  const next = create(Glyph1DSchema, { ...glyph });
  if (glyph.stroke !== undefined) {
    next.stroke = recolorStroke(glyph.stroke, change, diffRoles, true);
  }
  if (glyph.glow !== undefined) {
    next.glow = recolorGlow(glyph.glow, change, diffRoles);
  }
  return next;
}

// packages/core/src/delta/diff_palette.ts
function changeOf(map, id) {
  const change = map[id];
  return change === undefined ? 1 /* UNCHANGED */ : change;
}
function applyDiffPalette(laidOut, overlay, tokens) {
  const diffRoles = resolveDiffRoles(tokens);
  const nodes = {};
  for (const [id, node] of Object.entries(laidOut.nodes)) {
    const change = changeOf(overlay.nodes, id);
    nodes[id] = init(new LaidOutNode, {
      ...node,
      shape: recolorShape(node.shape, change, diffRoles),
      typography: node.typography
    });
  }
  const groups = {};
  for (const [id, group] of Object.entries(laidOut.groups)) {
    const change = changeOf(overlay.groups, id);
    groups[id] = init(new LaidOutGroup, {
      ...group,
      shape: recolorShape(group.shape, change, diffRoles),
      typography: group.typography
    });
  }
  const edges = {};
  for (const [id, edge] of Object.entries(laidOut.edges)) {
    const change = changeOf(overlay.edges, id);
    edges[id] = init(new LaidOutEdge, {
      ...edge,
      connection: recolorLine(edge.connection, change, diffRoles),
      typography: edge.typography
    });
  }
  const annotations = {};
  for (const [id, annotation] of Object.entries(laidOut.annotations)) {
    annotations[id] = init(new LaidOutAnnotation, {
      ...annotation,
      shape: recolorShape(annotation.shape, 1 /* UNCHANGED */, diffRoles),
      typography: annotation.typography,
      callout: annotation.callout === undefined ? undefined : recolorLine(annotation.callout, 1 /* UNCHANGED */, diffRoles)
    });
  }
  return init(new LaidOutDiagram, {
    id: laidOut.id,
    canvas: laidOut.canvas,
    nodes,
    edges,
    groups,
    annotations
  });
}

// packages/core/src/delta/delta_overlay.ts
class DeltaOverlay {
  diagram;
  nodes;
  edges;
  groups;
}

// packages/core/src/delta/merge_delta.ts
function mergeDelta(target, delta) {
  const graph = target.graph;
  const elements = graph !== undefined ? { ...graph.elements } : {};
  const edges = graph !== undefined ? { ...graph.edges } : {};
  const elementTypes = {};
  const edgeTypes = {};
  const restoredElements = new Set;
  const restoredEdges = new Set;
  for (const key of Object.keys(elements))
    elementTypes[key] = 1 /* UNCHANGED */;
  for (const key of Object.keys(edges))
    edgeTypes[key] = 1 /* UNCHANGED */;
  for (const entry of delta.elementDeltas) {
    const absent = elements[entry.elementId] === undefined;
    const side = entry.changeType === 3 /* DELETED */ ? entry.before : entry.after;
    if (entry.changeType === 0 /* CHANGE_TYPE_UNSPECIFIED */) {
      continue;
    }
    if (absent) {
      if (side !== undefined) {
        elements[entry.elementId] = side;
        elementTypes[entry.elementId] = entry.changeType;
        restoredElements.add(entry.elementId);
      }
    } else {
      elementTypes[entry.elementId] = entry.changeType;
    }
  }
  for (const entry of delta.edgeDeltas) {
    const absent = edges[entry.edgeId] === undefined;
    const side = entry.changeType === 3 /* DELETED */ ? entry.before : entry.after;
    if (entry.changeType === 0 /* CHANGE_TYPE_UNSPECIFIED */) {
      continue;
    }
    if (absent) {
      if (side !== undefined) {
        edges[entry.edgeId] = side;
        edgeTypes[entry.edgeId] = entry.changeType;
        restoredEdges.add(entry.edgeId);
      }
    } else {
      edgeTypes[entry.edgeId] = entry.changeType;
    }
  }
  for (const key of restoredElements) {
    const element = elements[key];
    if (element.parent !== undefined && elements[element.parent] === undefined) {
      elements[key] = create(ElementSchema, { ...element, parent: undefined });
    }
  }
  const isEntity = (id) => elements[id] !== undefined && elements[id].role !== 2 /* GROUPING */;
  for (const key of Object.keys(edges)) {
    const edge = edges[key];
    if (restoredEdges.has(key) && (!isEntity(edge.source) || !isEntity(edge.target))) {
      delete edges[key];
      delete edgeTypes[key];
    }
  }
  const mergedGraph = create(GraphSchema, { elements, edges });
  const diagram = create(DiagramSchema, {
    schemaVersion: target.schemaVersion,
    id: target.id,
    title: target.title,
    graph: mergedGraph,
    metadata: target.metadata
  });
  const children = childrenIndex(elements);
  const nodeTypes = {};
  const groupTypes = {};
  for (const key of Object.keys(elementTypes)) {
    if (isGroupLike(elements, children, key)) {
      groupTypes[key] = elementTypes[key];
    } else {
      nodeTypes[key] = elementTypes[key];
    }
  }
  return init(new DeltaOverlay, {
    diagram,
    nodes: nodeTypes,
    edges: edgeTypes,
    groups: groupTypes
  });
}

// packages/core/src/resolver/seed_bindings/impl.ts
function isUnset(component) {
  return component === undefined || component === "";
}
function seedComponentBindings(diagram, stylesheet, theme) {
  if (theme === undefined) {
    return stylesheet;
  }
  const graph = diagram.graph;
  const elements = { ...stylesheet.elements };
  const edges = { ...stylesheet.edges };
  const annotations = { ...stylesheet.annotations };
  if (graph !== undefined) {
    const children = childrenIndex(graph.elements);
    const nodeNames = theme.nodeComponents.map((component) => component.name);
    const nodeDefault = theme.defaultNodeComponent;
    if (nodeDefault !== undefined && nodeDefault !== "") {
      for (const id of Object.keys(graph.elements)) {
        const existing = elements[id];
        const derived = deriveComponent(graph.elements[id].tags["kind"], nodeNames, nodeDefault);
        if (derived !== undefined && derived !== nodeDefault && isUnset(existing?.component)) {
          elements[id] = create(ElementStyleEntrySchema, { ...existing, component: derived });
        }
      }
    }
    const edgeNames = theme.edgeComponents.map((component) => component.name);
    const edgeDefault = theme.defaultEdgeComponent;
    if (edgeDefault !== undefined && edgeDefault !== "") {
      for (const id of Object.keys(graph.edges)) {
        const existing = edges[id];
        const derived = deriveComponent(graph.edges[id].tags["kind"], edgeNames, edgeDefault);
        if (derived !== undefined && derived !== edgeDefault && isUnset(existing?.component)) {
          edges[id] = create(EdgeStyleEntrySchema, { ...existing, component: derived });
        }
      }
    }
    const groupNames = theme.groupComponents.map((component) => component.name);
    const groupDefault = theme.defaultGroupComponent;
    if (groupDefault !== undefined && groupDefault !== "") {
      for (const id of Object.keys(graph.elements)) {
        if (!isGroupLike(graph.elements, children, id)) {
          continue;
        }
        const existing = elements[id];
        const derived = deriveComponent(graph.elements[id].tags["kind"], groupNames, groupDefault);
        if (derived !== undefined && derived !== groupDefault && isUnset(existing?.boxComponent)) {
          elements[id] = create(ElementStyleEntrySchema, { ...existing, boxComponent: derived });
        }
      }
    }
  }
  const annotationNames = theme.annotationComponents.map((component) => component.name);
  const annotationDefault = theme.defaultAnnotationComponent;
  if (annotationDefault !== undefined && annotationDefault !== "") {
    for (const id of Object.keys(annotations)) {
      const existing = annotations[id];
      const derived = deriveComponent(existing.tags["kind"], annotationNames, annotationDefault);
      if (derived !== undefined && derived !== annotationDefault && isUnset(existing.component)) {
        annotations[id] = create(AnnotationEntrySchema, { ...existing, component: derived });
      }
    }
  }
  return create(StylesheetSchema, { ...stylesheet, elements, edges, annotations });
}
// packages/core/src/pipeline/scene_pipeline.ts
async function scenePipeline(diagram, stylesheet, themes, layoutEngine, delta) {
  let target = diagram;
  let sheet = stylesheet;
  let overlay;
  if (delta !== undefined) {
    overlay = mergeDelta(diagram, delta);
    target = overlay.diagram;
    sheet = seedComponentBindings(overlay.diagram, stylesheet ?? create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }), themes.get("default"));
  }
  const layoutResult = await layoutPipeline(target, sheet, themes, layoutEngine);
  if (layoutResult.kind === "err") {
    return Err(layoutResult.error);
  }
  return Ok(overlay === undefined ? layoutResult.value : applyDiffPalette(layoutResult.value, overlay, themes.get("default")?.tokens));
}
async function layoutPipeline(diagram, stylesheet, themes, layoutEngine) {
  const resolveResult = resolvePipeline(diagram, stylesheet, themes);
  if (resolveResult.kind === "err") {
    return Err(resolveResult.error);
  }
  const layoutResult = await layoutEngine.layout(init(new LayoutRequest, { diagram: resolveResult.value }));
  if (layoutResult.kind === "err") {
    return Err(init(new PipelineError, { stage: "layout", detail: layoutResult.error.message }));
  }
  return Ok(layoutResult.value);
}

// packages/core/src/pipeline/render_pipeline.ts
async function renderPipeline(diagram, stylesheet, themes, layoutEngine, delta) {
  const sceneResult = await scenePipeline(diagram, stylesheet, themes, layoutEngine, delta);
  if (sceneResult.kind === "err") {
    return Err(sceneResult.error);
  }
  const renderResult = new SvgRendererImpl().render(sceneResult.value);
  if (renderResult.kind === "err") {
    return Err(init(new PipelineError, { stage: "render", detail: renderResult.error.message }));
  }
  return Ok(renderResult.value);
}
// packages/core/src/text/font_metrics/impl.ts
var MONOSPACE_ADVANCE_WIDTH_RATIO = 0.6;
var LINE_HEIGHT_RATIO = 1.2;
function measureLabel(text, font, size) {
  const lines = text.split(`
`);
  let longestLineLength = 0;
  for (const line of lines) {
    longestLineLength = Math.max(longestLineLength, line.length);
  }
  const width = longestLineLength * MONOSPACE_ADVANCE_WIDTH_RATIO * size;
  const height = lines.length * LINE_HEIGHT_RATIO * size;
  return {
    x: width,
    y: height
  };
}
// packages/core/src/layout/default_size.ts
var DEFAULT_WIDTH = 120;
var DEFAULT_HEIGHT = 40;

// packages/core/src/layout/layout_engine/impl.ts
function pinnedPositions(diagram) {
  const pinned = new Map;
  for (const node of Object.values(diagram.nodes)) {
    if (node.layout?.position !== undefined) {
      pinned.set(node.id, node.layout.position);
    }
  }
  for (const group of Object.values(diagram.groups)) {
    if (group.layout?.position !== undefined) {
      pinned.set(group.id, group.layout.position);
    }
  }
  return pinned;
}
function withSeededPositions(diagram, seeded) {
  const apply = (element) => {
    const position = seeded.get(element.id);
    if (position === undefined || element.layout?.position !== undefined) {
      return element;
    }
    return Object.assign(Object.create(Object.getPrototypeOf(element)), element, {
      layout: Object.assign({}, element.layout, { position })
    });
  };
  return Object.assign(Object.create(Object.getPrototypeOf(diagram)), diagram, {
    nodes: Object.fromEntries(Object.entries(diagram.nodes).map(([id, node]) => [id, apply(node)])),
    groups: Object.fromEntries(Object.entries(diagram.groups).map(([id, group]) => [id, apply(group)]))
  });
}
function labelRoom(label, typography) {
  const fontSize = typography?.size ?? 13;
  let width = 0;
  let height = 0;
  for (const content of label) {
    const measured = measureLabel(content.source, typography?.font ?? "", fontSize);
    width = Math.max(width, measured.x + 2 * 12);
    height = Math.max(height, measured.y + 2 * 12);
  }
  return { x: width, y: height };
}

class LayoutEngineImpl {
  adapter;
  constructor(adapter) {
    this.adapter = adapter;
  }
  isFullyPinned(diagram) {
    return Object.values(diagram.nodes).every((node) => node.layout?.position !== undefined) && Object.values(diagram.groups).every((group) => group.layout?.position !== undefined);
  }
  async layout(request) {
    if (this.isFullyPinned(request.diagram)) {
      return Ok(this.layoutFromPins(request.diagram));
    }
    const pinned = pinnedPositions(request.diagram);
    if (pinned.size > 0) {
      const seeded = await this.adapter.seedPositions(request.diagram, pinned);
      return Ok(this.layoutFromPins(withSeededPositions(request.diagram, seeded)));
    }
    const result = await this.adapter.runLayout(request.diagram);
    if (result.kind === "err") {
      return result;
    }
    this.absolutizePositions(result.value);
    const laid = result.value;
    for (const node of Object.values(laid.nodes)) {
      const position = request.diagram.nodes[node.id]?.layout?.position;
      if (position !== undefined) {
        const parent = node.parentGroup === undefined ? undefined : laid.groups[node.parentGroup];
        node.position = parent === undefined ? position : create(Vec2Schema, { x: parent.position.x + position.x, y: parent.position.y + position.y });
      }
    }
    for (const group of Object.values(laid.groups)) {
      const position = request.diagram.groups[group.id]?.layout?.position;
      if (position !== undefined) {
        const parent = group.parentGroup === undefined ? undefined : laid.groups[group.parentGroup];
        group.position = parent === undefined ? position : create(Vec2Schema, { x: parent.position.x + position.x, y: parent.position.y + position.y });
      }
    }
    for (const edge of Object.values(laid.edges)) {
      const waypoints = request.diagram.edges[edge.id]?.layout?.waypoints;
      if (waypoints !== undefined && waypoints.length > 0) {
        edge.sections = [init(new EdgeSection, {
          startPoint: waypoints[0],
          endPoint: waypoints[waypoints.length - 1],
          bendPoints: waypoints.slice(1, -1)
        })];
      }
    }
    return Ok(laid);
  }
  layoutFromPins(diagram) {
    const absoluteGroupPosition = (id) => {
      const group = diagram.groups[id];
      if (group === undefined || group.layout?.position === undefined) {
        return { x: 0, y: 0 };
      }
      const parent = group.parentGroup === undefined ? { x: 0, y: 0 } : absoluteGroupPosition(group.parentGroup);
      return { x: parent.x + group.layout.position.x, y: parent.y + group.layout.position.y };
    };
    const sizeForLabel = (label, typography) => {
      let width = 0;
      let height = 0;
      for (const content of label) {
        const size = measureLabel(content.source, typography.font ?? "", typography.size ?? 16);
        width = Math.max(width, size.x);
        height = Math.max(height, size.y);
      }
      return { x: width, y: height };
    };
    const nodeSize = (node) => {
      if (node.layout?.size !== undefined) {
        return node.layout.size;
      }
      const label = sizeForLabel(node.label, node.typography);
      return { x: Math.max(DEFAULT_WIDTH, label.x), y: Math.max(DEFAULT_HEIGHT, label.y) };
    };
    const nodes = Object.fromEntries(Object.values(diagram.nodes).map((node) => {
      const local = node.layout?.position;
      const parent = node.parentGroup === undefined ? { x: 0, y: 0 } : absoluteGroupPosition(node.parentGroup);
      return [node.id, init(new LaidOutNode, {
        id: node.id,
        parentGroup: node.parentGroup,
        position: create(Vec2Schema, { x: local.x + parent.x, y: local.y + parent.y }),
        size: create(Vec2Schema, nodeSize(node)),
        shape: node.shape,
        typography: node.typography,
        label: node.label,
        layout: node.layout
      })];
    }));
    const computedGroupSize = new Map;
    const groupSize = (group) => {
      const existing = computedGroupSize.get(group.id);
      if (existing !== undefined)
        return existing;
      const origin = absoluteGroupPosition(group.id);
      let width = 0;
      let height = 0;
      const extend = (x, y, w, h) => {
        width = Math.max(width, x - origin.x + w, origin.x - x + w);
        height = Math.max(height, y - origin.y + h, origin.y - y + h);
      };
      for (const child of Object.values(nodes).filter((node) => node.parentGroup === group.id)) {
        extend(child.position.x, child.position.y, child.size.x, child.size.y);
      }
      for (const child of Object.values(diagram.groups).filter((candidate) => candidate.parentGroup === group.id)) {
        const childOrigin = absoluteGroupPosition(child.id);
        const childExtent = groupSize(child);
        extend(childOrigin.x, childOrigin.y, childExtent.x, childExtent.y);
      }
      if (width > 0 || height > 0) {
        const inset = group.typography?.size ?? 13;
        width += inset;
        height += inset;
      }
      const room = labelRoom(group.label, group.typography);
      width = Math.max(width, room.x);
      height = Math.max(height, room.y);
      const requested = group.layout?.size;
      const size = requested === undefined ? { x: width, y: height } : { x: Math.max(width, requested.x), y: Math.max(height, requested.y) };
      computedGroupSize.set(group.id, size);
      return size;
    };
    const groups = Object.fromEntries(Object.values(diagram.groups).map((group) => {
      const position = absoluteGroupPosition(group.id);
      const size = groupSize(group);
      return [group.id, init(new LaidOutGroup, {
        id: group.id,
        parentGroup: group.parentGroup,
        position: create(Vec2Schema, position),
        size: create(Vec2Schema, size),
        shape: group.shape,
        typography: group.typography,
        label: group.label,
        isSuperNode: group.isSuperNode,
        hiddenDescendantCount: group.hiddenDescendantCount,
        layout: group.layout
      })];
    }));
    const endpointBounds = (id) => {
      const node = nodes[id];
      if (node !== undefined)
        return boundsFromRect(node.position, node.size);
      const group = groups[id];
      return group === undefined ? boundsFromRect(create(Vec2Schema, { x: 0, y: 0 }), create(Vec2Schema, { x: 0, y: 0 })) : boundsFromRect(group.position, group.size);
    };
    const edges = Object.fromEntries(Object.values(diagram.edges).map((edge) => {
      const layout = edge.layout;
      const waypoints = layout?.routing === 4 /* ROUTING_MANUAL */ && layout.waypoints.length > 0 ? layout.waypoints : layout?.routing === 2 /* ROUTING_ORTHOGONAL */ ? routeOrthogonal(endpointBounds(edge.source), endpointBounds(edge.target), layout?.sourceAttach, layout?.targetAttach) : routeStraight(endpointBounds(edge.source), endpointBounds(edge.target), layout?.sourceAttach, layout?.targetAttach);
      return [edge.id, init(new LaidOutEdge, {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sections: [init(new EdgeSection, {
          startPoint: waypoints[0],
          endPoint: waypoints[waypoints.length - 1],
          bendPoints: waypoints.slice(1, -1)
        })],
        connection: edge.connection,
        typography: edge.typography,
        label: edge.label,
        layout: edge.layout
      })];
    }));
    const annotations = Object.fromEntries(Object.values(diagram.annotations).map((annotation) => {
      const measured = sizeForLabel(annotation.content, annotation.typography);
      const position = annotation.layout?.position ?? create(Vec2Schema, { x: 0, y: 0 });
      const size = annotation.layout?.size ?? create(Vec2Schema, measured);
      return [annotation.id, init(new LaidOutAnnotation, {
        id: annotation.id,
        position,
        size,
        anchor: annotation.anchor,
        shape: annotation.shape,
        typography: annotation.typography,
        callout: annotation.callout,
        layout: annotation.layout,
        content: annotation.content
      })];
    }));
    return init(new LaidOutDiagram, {
      id: diagram.id,
      canvas: diagram.canvas,
      nodes,
      groups,
      edges,
      annotations
    });
  }
  absolutizePositions(laid) {
    function depthOf(group) {
      let depth = 0;
      let current = group;
      while (current?.parentGroup !== undefined) {
        current = laid.groups[current.parentGroup];
        depth += 1;
      }
      return depth;
    }
    const orderedGroups = Object.values(laid.groups).sort((a, b) => depthOf(a) - depthOf(b));
    for (const group of orderedGroups) {
      if (group.parentGroup !== undefined) {
        const parent = laid.groups[group.parentGroup];
        if (parent !== undefined)
          group.position = create(Vec2Schema, { x: group.position.x + parent.position.x, y: group.position.y + parent.position.y });
      }
    }
    for (const node of Object.values(laid.nodes)) {
      const parent = node.parentGroup === undefined ? undefined : laid.groups[node.parentGroup];
      if (parent !== undefined)
        node.position = create(Vec2Schema, { x: node.position.x + parent.position.x, y: node.position.y + parent.position.y });
    }
  }
}
// packages/core/src/layout/layout_error/impl.ts
class LayoutError {
  message;
}
// packages/core/src/layout/seed_newcomers.ts
var GAP = 20;
function vec2(x, y) {
  return create(Vec2Schema, { x, y });
}
function rect(item) {
  return {
    minX: item.x,
    minY: item.y,
    maxX: item.x + item.width,
    maxY: item.y + item.height
  };
}
var INSET = 16;
var GROUP_LABEL_PADDING2 = 12;
function parentOf(diagram, id) {
  return diagram.nodes[id]?.parentGroup ?? diagram.groups[id]?.parentGroup;
}
function absoluteOrigins(diagram, pinned, seeded) {
  const origins = new Map;
  const resolving = new Set;
  const originOf = (groupId) => {
    if (groupId === undefined || diagram.groups[groupId] === undefined)
      return vec2(0, 0);
    const done = origins.get(groupId);
    if (done !== undefined)
      return done;
    if (resolving.has(groupId))
      return vec2(0, 0);
    resolving.add(groupId);
    const pin = pinned.get(groupId);
    let origin;
    if (pin !== undefined) {
      const parent = originOf(parentOf(diagram, groupId));
      origin = vec2(parent.x + pin.x, parent.y + pin.y);
    } else {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      for (const childId of [...Object.keys(diagram.nodes), ...Object.keys(diagram.groups)].sort()) {
        if (parentOf(diagram, childId) !== groupId)
          continue;
        const childAt = diagram.groups[childId] !== undefined ? originOf(childId) : seeded.get(childId);
        if (childAt === undefined)
          continue;
        minX = Math.min(minX, childAt.x);
        minY = Math.min(minY, childAt.y);
      }
      const labelled = diagram.groups[groupId];
      const fontSize = labelled?.typography?.size ?? 13;
      const topInset = labelled !== undefined && labelled.label.length > 0 ? Math.max(INSET, Math.round(fontSize * 1.2) + 2 * GROUP_LABEL_PADDING2) : INSET;
      origin = minX === Number.POSITIVE_INFINITY ? seeded.get(groupId) ?? vec2(0, 0) : vec2(minX - INSET, minY - topInset);
    }
    resolving.delete(groupId);
    origins.set(groupId, origin);
    return origin;
  };
  for (const groupId of Object.keys(diagram.groups).sort())
    originOf(groupId);
  return origins;
}
function sizeOf(item) {
  return item.layout?.size ?? vec2(DEFAULT_WIDTH, DEFAULT_HEIGHT);
}
async function seedNewcomers(diagram, pinned, elk) {
  const pinnedOrigins = absoluteOrigins(diagram, pinned, new Map);
  const absolutePin = (id) => {
    const pin = pinned.get(id);
    if (pin === undefined)
      return;
    const parent = pinnedOrigins.get(parentOf(diagram, id) ?? "") ?? vec2(0, 0);
    return vec2(parent.x + pin.x, parent.y + pin.y);
  };
  const elements = new Map;
  for (const group of Object.values(diagram.groups)) {
    const size = sizeOf(group);
    elements.set(group.id, { id: group.id, width: size.x, height: size.y, position: absolutePin(group.id) });
  }
  for (const node of Object.values(diagram.nodes)) {
    const size = sizeOf(node);
    elements.set(node.id, { id: node.id, width: size.x, height: size.y, position: absolutePin(node.id) });
  }
  const newcomerIds = [...elements.values()].filter((item) => item.position === undefined).map((item) => item.id).sort();
  const result = new Map;
  if (newcomerIds.length === 0)
    return result;
  const adjacency = new Map;
  for (const id of elements.keys())
    adjacency.set(id, new Set);
  for (const edge of Object.values(diagram.edges)) {
    if (!elements.has(edge.source) || !elements.has(edge.target))
      continue;
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }
  const pinnedIds = [...elements.values()].filter((item) => item.position !== undefined).map((item) => item.id).sort();
  const pinnedRects = pinnedIds.map((id) => {
    const item = elements.get(id);
    return { id, x: item.position.x, y: item.position.y, width: item.width, height: item.height };
  });
  let contentBounds;
  for (const item of pinnedRects)
    contentBounds = contentBounds === undefined ? rect(item) : boundsUnion(contentBounds, rect(item));
  const fallbackY = (contentBounds?.maxY ?? 0) + GAP;
  let fallbackIndex = 0;
  const remaining = new Set(newcomerIds);
  while (remaining.size > 0) {
    const first = [...remaining].sort()[0];
    const component = new Set([first]);
    const queue = [first];
    remaining.delete(first);
    while (queue.length > 0) {
      const current = queue.shift();
      for (const neighbour of [...adjacency.get(current) ?? []].sort()) {
        if (elements.get(neighbour)?.position === undefined) {
          if (!component.has(neighbour)) {
            component.add(neighbour);
            remaining.delete(neighbour);
            queue.push(neighbour);
          }
        }
      }
    }
    const anchors = new Set;
    for (const id of component) {
      for (const neighbour of adjacency.get(id) ?? []) {
        if (elements.get(neighbour)?.position !== undefined)
          anchors.add(neighbour);
      }
    }
    if (anchors.size === 0) {
      for (const id of [...component].sort()) {
        const item = elements.get(id);
        result.set(id, vec2(fallbackIndex * (item.width + GAP), fallbackY));
        fallbackIndex += 1;
      }
      continue;
    }
    const included = new Set([...component, ...anchors]);
    const children = [...included].sort().map((id) => {
      const item = elements.get(id);
      const node = { id, width: item.width, height: item.height };
      if (item.position !== undefined) {
        node.x = item.position.x;
        node.y = item.position.y;
        node.layoutOptions = { "org.eclipse.elk.fixed": "true" };
      }
      return node;
    });
    const edges = Object.values(diagram.edges).filter((edge) => included.has(edge.source) && included.has(edge.target)).sort((a, b) => a.id.localeCompare(b.id)).map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] }));
    const laidOut = await elk.layout({
      id: `seed-${[...component].sort()[0]}`,
      children,
      edges,
      layoutOptions: {
        "org.eclipse.elk.algorithm": "org.eclipse.elk.layered",
        "org.eclipse.elk.interactive": "true",
        "org.eclipse.elk.spacing.nodeNode": String(GAP)
      }
    });
    const laid = new Map;
    for (const child of laidOut.children ?? []) {
      const item = elements.get(child.id);
      laid.set(child.id, {
        id: child.id,
        x: child.x ?? 0,
        y: child.y ?? 0,
        width: item.width,
        height: item.height
      });
    }
    let dx = 0;
    let dy = 0;
    for (const id of [...anchors].sort()) {
      const actual = elements.get(id).position;
      const generated = laid.get(id);
      if (generated !== undefined) {
        dx += actual.x - generated.x;
        dy += actual.y - generated.y;
      }
    }
    dx /= anchors.size;
    dy /= anchors.size;
    const occupied = pinnedRects.concat([...result.entries()].map(([id, at]) => {
      const item = elements.get(id);
      return { id, x: at.x, y: at.y, width: item.width, height: item.height };
    }));
    let shiftY = 0;
    while (true) {
      const collision = [...component].sort().some((id) => {
        const item = laid.get(id);
        return occupied.some((taken) => boundsIntersects({ minX: item.x + dx, minY: item.y + dy + shiftY, maxX: item.x + dx + item.width, maxY: item.y + dy + shiftY + item.height }, rect(taken)));
      });
      if (!collision)
        break;
      shiftY += GAP;
    }
    for (const id of [...component].sort()) {
      const item = laid.get(id);
      result.set(id, vec2(item.x + dx, item.y + dy + shiftY));
    }
  }
  const origins = absoluteOrigins(diagram, pinned, result);
  const relative = new Map;
  for (const id of [...result.keys()].sort()) {
    const own = diagram.groups[id] !== undefined ? origins.get(id) ?? result.get(id) : result.get(id);
    const parent = origins.get(parentOf(diagram, id) ?? "") ?? vec2(0, 0);
    relative.set(id, vec2(own.x - parent.x, own.y - parent.y));
  }
  return relative;
}

// packages/core/src/layout/layout_adapter/impl.ts
function vec22(x, y) {
  return create(Vec2Schema, { x, y });
}
function boxSize(layout, label, typography) {
  if (layout?.size !== undefined) {
    return { width: layout.size.x, height: layout.size.y };
  }
  let width = DEFAULT_WIDTH;
  let height = DEFAULT_HEIGHT;
  for (const content of label) {
    const measured = measureLabel(content.source, typography?.font ?? "", typography?.size ?? 16);
    width = Math.max(width, measured.x);
    height = Math.max(height, measured.y);
  }
  return { width, height };
}

class ElkAdapterImpl {
  elk;
  async seedPositions(diagram, pinned) {
    return seedNewcomers(diagram, pinned, this.elk);
  }
  constructor(elk) {
    this.elk = elk;
  }
  async runLayout(diagram) {
    try {
      let walkElkNode = function(elkNode, origin) {
        if (elkNode.id !== "root") {
          nodePositions[elkNode.id] = {
            x: elkNode.x ?? 0,
            y: elkNode.y ?? 0,
            w: elkNode.width ?? DEFAULT_WIDTH,
            h: elkNode.height ?? DEFAULT_HEIGHT
          };
        }
        const absolute = vec22(origin.x + (elkNode.x ?? 0), origin.y + (elkNode.y ?? 0));
        containerOrigin[elkNode.id] = absolute;
        const elkEdges = elkNode.edges ?? [];
        for (const edge of elkEdges) {
          const sections = edge.sections ?? [];
          const existing = edgeSectionsRaw[edge.id];
          if (sections.length > 0 || existing === undefined) {
            edgeSectionsRaw[edge.id] = sections;
          }
        }
        const elkChildren = elkNode.children ?? [];
        for (const child of elkChildren) {
          walkElkNode(child, absolute);
        }
      }, ancestry = function(id) {
        const chain = [];
        let current = parentOf2[id];
        const seen = new Set;
        while (current !== undefined && !seen.has(current)) {
          seen.add(current);
          chain.unshift(current);
          current = parentOf2[current];
        }
        return chain;
      }, edgeOrigin = function(source, target) {
        const a = ancestry(source);
        const b = ancestry(target);
        if (b.includes(source)) {
          return containerOrigin[source] ?? vec22(0, 0);
        }
        if (a.includes(target)) {
          return containerOrigin[target] ?? vec22(0, 0);
        }
        let common;
        for (let i = 0;i < Math.min(a.length, b.length); i++) {
          if (a[i] !== b[i]) {
            break;
          }
          common = a[i];
        }
        return common === undefined ? vec22(0, 0) : containerOrigin[common] ?? vec22(0, 0);
      };
      const groupElkNodes = {};
      for (const group of Object.values(diagram.groups)) {
        const position = group.layout?.position;
        groupElkNodes[group.id] = group.isSuperNode ? {
          id: group.id,
          ...boxSize(group.layout, group.label, group.typography),
          ...position !== undefined ? {
            x: position.x,
            y: position.y,
            layoutOptions: { "org.eclipse.elk.position": `(${position.x},${position.y})` }
          } : {}
        } : {
          id: group.id,
          ...boxSize(group.layout, group.label, group.typography),
          children: [],
          edges: [],
          ...position !== undefined ? {
            x: position.x,
            y: position.y,
            layoutOptions: { "org.eclipse.elk.position": `(${position.x},${position.y})` }
          } : {}
        };
        if (position !== undefined) {
          groupElkNodes[group.id].x = position.x;
          groupElkNodes[group.id].y = position.y;
          groupElkNodes[group.id].layoutOptions = { "org.eclipse.elk.position": `(${position.x},${position.y})` };
        }
      }
      const rootChildren = [];
      for (const group of Object.values(diagram.groups)) {
        const elkGroup = groupElkNodes[group.id];
        if (group.parentGroup) {
          const parent = groupElkNodes[group.parentGroup];
          if (parent?.children) {
            parent.children.push(elkGroup);
          } else {
            rootChildren.push(elkGroup);
          }
        } else {
          rootChildren.push(elkGroup);
        }
      }
      for (const node of Object.values(diagram.nodes)) {
        const position = node.layout?.position;
        const elkNode = {
          id: node.id,
          ...boxSize(node.layout, node.label, node.typography),
          ...position !== undefined ? {
            x: position.x,
            y: position.y,
            layoutOptions: { "org.eclipse.elk.position": `(${position.x},${position.y})` }
          } : {}
        };
        if (position !== undefined) {
          elkNode.x = position.x;
          elkNode.y = position.y;
          elkNode.layoutOptions = { "org.eclipse.elk.position": `(${position.x},${position.y})` };
        }
        if (node.parentGroup) {
          const parent = groupElkNodes[node.parentGroup];
          if (parent?.children) {
            parent.children.push(elkNode);
          } else {
            rootChildren.push(elkNode);
          }
        } else {
          rootChildren.push(elkNode);
        }
      }
      for (const group of Object.values(diagram.groups)) {
        const elkGroup = groupElkNodes[group.id];
        const hasPositionedChild = Object.values(diagram.groups).some((child) => child.parentGroup === group.id && child.layout?.position !== undefined) || Object.values(diagram.nodes).some((child) => child.parentGroup === group.id && child.layout?.position !== undefined);
        if (hasPositionedChild) {
          elkGroup.layoutOptions = {
            ...elkGroup.layoutOptions ?? {},
            "org.eclipse.elk.fixed": "true"
          };
        }
        const requested = group.layout?.size;
        const measured = boxSize(undefined, group.label, group.typography);
        const inset = group.typography?.size ?? 13;
        const minWidth = Math.max(requested?.x ?? 0, measured.width + 2 * inset);
        const minHeight = Math.max(requested?.y ?? 0, measured.height);
        const band = group.label.length > 0 ? Math.round(measured.height + 2 * inset) : inset;
        elkGroup.layoutOptions = {
          ...elkGroup.layoutOptions ?? {},
          "org.eclipse.elk.nodeSize.constraints": "MINIMUM_SIZE",
          "org.eclipse.elk.nodeSize.minimum": `(${minWidth},${minHeight})`,
          "org.eclipse.elk.padding": `[top=${band},left=${inset},bottom=${inset},right=${inset}]`
        };
      }
      const layoutOptions = {
        "org.eclipse.elk.algorithm": "org.eclipse.elk.layered",
        "org.eclipse.elk.interactive": "true",
        "org.eclipse.elk.hierarchyHandling": "INCLUDE_CHILDREN"
      };
      const hasPositionedRootChild = Object.values(diagram.groups).some((group) => group.parentGroup === undefined && group.layout?.position !== undefined) || Object.values(diagram.nodes).some((node) => node.parentGroup === undefined && node.layout?.position !== undefined);
      if (hasPositionedRootChild) {
        layoutOptions["org.eclipse.elk.fixed"] = "true";
      }
      if (diagram.canvas?.nodeSpacing !== undefined) {
        layoutOptions["org.eclipse.elk.spacing.nodeNode"] = String(diagram.canvas.nodeSpacing);
      }
      if (diagram.canvas?.edgeSpacing !== undefined) {
        layoutOptions["org.eclipse.elk.spacing.edgeNode"] = String(diagram.canvas.edgeSpacing);
      }
      if (diagram.canvas?.margin !== undefined) {
        const margin = String(diagram.canvas.margin);
        layoutOptions["org.eclipse.elk.padding"] = `[top=${margin},left=${margin},bottom=${margin},right=${margin}]`;
      }
      const elkGraph = {
        id: "root",
        layoutOptions,
        children: rootChildren,
        edges: Object.values(diagram.edges).map((edge) => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target]
        }))
      };
      const result = await this.elk.layout(elkGraph);
      const nodePositions = {};
      const edgeSectionsRaw = {};
      const containerOrigin = {};
      walkElkNode(result, vec22(0, 0));
      const parentOf2 = {};
      for (const node of Object.values(diagram.nodes)) {
        parentOf2[node.id] = node.parentGroup;
      }
      for (const group of Object.values(diagram.groups)) {
        parentOf2[group.id] = group.parentGroup;
      }
      const nodes = Object.values(diagram.nodes).map((node) => {
        const pos = nodePositions[node.id] ?? { x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
        return init(new LaidOutNode, {
          id: node.id,
          parentGroup: node.parentGroup,
          position: vec22(pos.x, pos.y),
          size: vec22(pos.w, pos.h),
          shape: node.shape,
          typography: node.typography,
          label: node.label,
          layout: node.layout
        });
      });
      const edges = Object.values(diagram.edges).map((edge) => {
        const origin = edgeOrigin(edge.source, edge.target);
        const point2 = (p) => vec22(origin.x + (p?.x ?? 0), origin.y + (p?.y ?? 0));
        const sections = (edgeSectionsRaw[edge.id] ?? []).map((s) => init(new EdgeSection, {
          startPoint: point2(s.startPoint),
          bendPoints: (s.bendPoints ?? []).map(point2),
          endPoint: point2(s.endPoint)
        }));
        return init(new LaidOutEdge, {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sections,
          connection: edge.connection,
          typography: edge.typography,
          label: edge.label,
          layout: edge.layout
        });
      });
      const groups = Object.values(diagram.groups).map((group) => {
        const pos = nodePositions[group.id] ?? { x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT };
        return init(new LaidOutGroup, {
          id: group.id,
          parentGroup: group.parentGroup,
          position: vec22(pos.x, pos.y),
          size: vec22(pos.w, pos.h),
          shape: group.shape,
          typography: group.typography,
          label: group.label,
          isSuperNode: group.isSuperNode,
          hiddenDescendantCount: group.hiddenDescendantCount,
          layout: group.layout
        });
      });
      const annotations = Object.values(diagram.annotations).map((ann) => {
        const font = ann.typography.font ?? "";
        const fontSize = ann.typography.size ?? 16;
        let measuredWidth = 0;
        let measuredHeight = 0;
        for (const localizedContent of ann.content) {
          const measured = measureLabel(localizedContent.source, font, fontSize);
          measuredWidth = Math.max(measuredWidth, measured.x);
          measuredHeight = Math.max(measuredHeight, measured.y);
        }
        const size = ann.layout?.size ?? vec22(measuredWidth, measuredHeight);
        return init(new LaidOutAnnotation, {
          id: ann.id,
          anchor: ann.anchor,
          position: ann.layout?.position ?? vec22(0, 0),
          size,
          shape: ann.shape,
          typography: ann.typography,
          callout: ann.callout,
          layout: ann.layout,
          content: ann.content
        });
      });
      const byId = (items) => Object.fromEntries(items.map((item) => [item.id, item]));
      return Ok(init(new LaidOutDiagram, {
        id: diagram.id,
        canvas: diagram.canvas,
        nodes: byId(nodes),
        edges: byId(edges),
        groups: byId(groups),
        annotations: byId(annotations)
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return Err(init(new LayoutError, { message }));
    }
  }
}
// packages/core/src/layout/elk_host_node/impl.ts
import ElkConstructor from "elkjs";
import { createRequire } from "node:module";
var require2 = createRequire(import.meta.url);
function createNodeElk() {
  return new ElkConstructor({
    workerUrl: require2.resolve("elkjs/lib/elk-worker.min.js")
  });
}
// packages/ops/src/render/render_params.ts
class RenderParams {
  diagram;
  style;
  theme;
  delta;
  out;
}
var renderParamsSchema = exports_external.object({
  diagram: exports_external.string().describe("Path to the .arch diagram file to render."),
  style: exports_external.string().optional().describe("Path to a .style stylesheet; uses the diagram default if omitted."),
  theme: exports_external.string().optional().describe("Rebind one theme name: <name>=<theme>, or a bare <theme> to rebind `default`. The theme is a bundled name (light, dark, blueprint) or a path. Without this, the stylesheet's own bindings are used."),
  delta: exports_external.string().optional().describe("Path to a Delta JSON file from `archeglyph diff`. Draws the union of the diagram and what the Delta says was deleted, coloured by change type."),
  out: exports_external.string().optional().describe("Output SVG path; defaults to the diagram path with a .svg extension.")
});

// packages/ops/src/render/render_output.ts
class RenderOutput {
  svg;
  outPath;
  bytesWritten;
}

// packages/ops/src/render/render_op_error.ts
class RenderOpError {
  stage;
  cause;
}

// packages/ops/src/style_path.ts
import { basename, dirname, join } from "node:path";
function deriveDefaultStylePath(diagramPath) {
  const diagBase = basename(diagramPath);
  const dotIdx = diagBase.indexOf(".");
  const stem = dotIdx >= 0 ? diagBase.slice(0, dotIdx) : diagBase;
  return join(dirname(diagramPath), stem + ".style.json");
}

// packages/ops/src/themes/resolve_themes.ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// packages/themes/src/index.ts
var BUNDLED_THEME_NAMES = ["light", "dark", "blueprint"];
var BLUEPRINT_PALETTE = {
  sky: "#38bdf8",
  navy: "#122238",
  ice: "#bfe3ff",
  teal: "#2dd4bf",
  violet: "#8b5cf6",
  slate: "#8b98a9",
  mist: "#b3c0cf",
  ground: "#0f1724"
};
var LIGHT_PALETTE = {
  ink: "#000000",
  paper: "#FFFFFF",
  near: "#1a1a1a",
  grey: "#8A8A8A",
  dim: "#5a5a5a",
  ground: "#F5F5F5",
  green: "#2e7d32",
  blue: "#1565c0",
  red: "#c62828"
};
var DARK_PALETTE = {
  white: "#FFFFFF",
  black: "#000000",
  lavender: "#c0caf5",
  steel: "#9aa5ce",
  slate: "#7f8694",
  mist: "#a7aec0",
  ground: "#1a1b26",
  green: "#9ece6a",
  blue: "#7aa2f7",
  red: "#f7768e"
};
var BLUEPRINT_ROLES = {
  node_outline: "$palette.sky",
  node_fill: "$palette.navy",
  node_glow: "$palette.sky",
  node_label: "$palette.ice",
  node_label_background: "$palette.navy",
  node_decoration: "$palette.sky",
  edge_stroke: "$palette.teal",
  edge_glow: "$palette.teal",
  edge_label: "$palette.ice",
  edge_label_background: "$palette.navy",
  group_outline: "$palette.violet",
  group_fill: "$palette.violet",
  group_glow: "$palette.violet",
  group_label: "$palette.violet",
  group_label_background: "$palette.navy",
  group_decoration: "$palette.violet",
  annotation_outline: "$palette.slate",
  annotation_fill: "$palette.slate",
  annotation_glow: "$palette.slate",
  annotation_label: "$palette.mist",
  annotation_label_background: "$palette.navy",
  annotation_decoration: "$palette.slate",
  annotation_callout: "$palette.slate",
  annotation_callout_glow: "$palette.slate",
  background: "$palette.ground"
};
var LIGHT_ROLES = {
  node_outline: "$palette.ink",
  node_fill: "$palette.paper",
  node_glow: "$palette.ink",
  node_label: "$palette.near",
  node_label_background: "$palette.paper",
  node_decoration: "$palette.ink",
  edge_stroke: "$palette.ink",
  edge_glow: "$palette.ink",
  edge_label: "$palette.near",
  edge_label_background: "$palette.paper",
  group_outline: "$palette.grey",
  group_fill: "$palette.grey",
  group_glow: "$palette.grey",
  group_label: "$palette.grey",
  group_label_background: "$palette.paper",
  group_decoration: "$palette.grey",
  annotation_outline: "$palette.grey",
  annotation_fill: "$palette.grey",
  annotation_glow: "$palette.grey",
  annotation_label: "$palette.dim",
  annotation_label_background: "$palette.paper",
  annotation_decoration: "$palette.grey",
  annotation_callout: "$palette.grey",
  annotation_callout_glow: "$palette.grey",
  background: "$palette.ground",
  diff_added: "$palette.green",
  diff_modified: "$palette.blue",
  diff_deleted: "$palette.red"
};
var DARK_ROLES = {
  node_outline: "$palette.white",
  node_fill: "$palette.black",
  node_glow: "$palette.white",
  node_label: "$palette.lavender",
  node_label_background: "$palette.black",
  node_decoration: "$palette.white",
  edge_stroke: "$palette.white",
  edge_glow: "$palette.white",
  edge_label: "$palette.lavender",
  edge_label_background: "$palette.black",
  group_outline: "$palette.steel",
  group_fill: "$palette.steel",
  group_glow: "$palette.steel",
  group_label: "$palette.steel",
  group_label_background: "$palette.black",
  group_decoration: "$palette.steel",
  annotation_outline: "$palette.slate",
  annotation_fill: "$palette.slate",
  annotation_glow: "$palette.slate",
  annotation_label: "$palette.mist",
  annotation_label_background: "$palette.black",
  annotation_decoration: "$palette.slate",
  annotation_callout: "$palette.slate",
  annotation_callout_glow: "$palette.slate",
  background: "$palette.ground",
  diff_added: "$palette.green",
  diff_modified: "$palette.blue",
  diff_deleted: "$palette.red"
};
function glyphNodeComponent() {
  return create(NodeComponentSchema, {
    name: "glyph",
    typography: create(TypographySchema, { color: create(ColorSchema, { value: "$roles.node_label" }) }),
    shape: create(Glyph2DSchema, {
      shapeKind: { case: "standard", value: 2 /* SHAPE_RECT */ },
      cornerRadius: 0,
      stroke: create(StrokeSchema, { paint: { case: "color", value: create(ColorSchema, { value: "$roles.node_outline" }) } }),
      fill: create(FillSchema, { paint: { case: "color", value: create(ColorSchema, { value: "$roles.node_fill" }) } })
    })
  });
}
function glyphEdgeComponent() {
  return create(EdgeComponentSchema, {
    name: "glyph",
    connection: create(Glyph1DSchema, {
      stroke: create(StrokeSchema, { paint: { case: "color", value: create(ColorSchema, { value: "$roles.edge_stroke" }) } })
    }),
    typography: create(TypographySchema, { color: create(ColorSchema, { value: "$roles.edge_label" }) })
  });
}
function glyphGroupComponent() {
  return create(NodeComponentSchema, {
    name: "glyph",
    shape: create(Glyph2DSchema, {
      shapeKind: { case: "standard", value: 2 /* SHAPE_RECT */ },
      cornerRadius: 3,
      stroke: create(StrokeSchema, {
        paint: { case: "color", value: create(ColorSchema, { value: "$roles.group_outline" }) },
        width: 1,
        dashing: { case: "customDasharray", value: "2,3" }
      }),
      fill: create(FillSchema, {
        paint: { case: "color", value: create(ColorSchema, { value: "$roles.group_fill" }) },
        opacity: 0.06
      })
    }),
    typography: create(TypographySchema, { color: create(ColorSchema, { value: "$roles.group_label" }) })
  });
}
function glyphAnnotationComponent() {
  return create(AnnotationComponentSchema, {
    name: "glyph",
    shape: create(Glyph2DSchema, {
      shapeKind: { case: "standard", value: 2 /* SHAPE_RECT */ },
      cornerRadius: 2,
      stroke: create(StrokeSchema, {
        paint: { case: "color", value: create(ColorSchema, { value: "$roles.annotation_outline" }) },
        width: 1
      })
    }),
    typography: create(TypographySchema, {
      color: create(ColorSchema, { value: "$roles.annotation_label" }),
      size: 11
    }),
    callout: create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: "color", value: create(ColorSchema, { value: "$roles.annotation_callout" }) },
        width: 1,
        dashing: { case: "customDasharray", value: "2,3" }
      })
    })
  });
}
function blueprintNodeShape(strokeColor, fillColor) {
  return create(Glyph2DSchema, {
    shapeKind: { case: "standard", value: 2 /* SHAPE_RECT */ },
    cornerRadius: 2,
    stroke: create(StrokeSchema, {
      paint: { case: "color", value: create(ColorSchema, { value: strokeColor }) },
      width: 1.2
    }),
    fill: create(FillSchema, {
      paint: { case: "color", value: create(ColorSchema, { value: fillColor }) },
      opacity: 0
    })
  });
}
function blueprintNodeComponent() {
  return create(NodeComponentSchema, {
    name: "glyph",
    shape: blueprintNodeShape("$roles.node_outline", "$roles.node_fill"),
    typography: create(TypographySchema, { color: create(ColorSchema, { value: "$roles.node_label" }) })
  });
}
function blueprintEdgeComponent() {
  return create(EdgeComponentSchema, {
    name: "glyph",
    connection: create(Glyph1DSchema, {
      stroke: create(StrokeSchema, {
        paint: { case: "color", value: create(ColorSchema, { value: "$roles.edge_stroke" }) },
        width: 1.2
      }),
      arrowheads: create(ArrowheadsSchema, {
        start: 1 /* ARROWHEAD_NONE */,
        end: 3 /* ARROWHEAD_FILLED */
      })
    }),
    typography: create(TypographySchema, { color: create(ColorSchema, { value: "$roles.edge_label" }) })
  });
}
function blueprintGroupComponent() {
  return create(NodeComponentSchema, {
    name: "glyph",
    shape: create(Glyph2DSchema, {
      shapeKind: { case: "standard", value: 2 /* SHAPE_RECT */ },
      cornerRadius: 3,
      stroke: create(StrokeSchema, {
        paint: { case: "color", value: create(ColorSchema, { value: "$roles.group_outline" }) },
        width: 1,
        dashing: { case: "customDasharray", value: "2,3" }
      }),
      fill: create(FillSchema, {
        paint: { case: "color", value: create(ColorSchema, { value: "$roles.group_fill" }) },
        opacity: 0.04
      })
    }),
    typography: create(TypographySchema, { color: create(ColorSchema, { value: "$roles.group_label" }) })
  });
}
function darkTheme() {
  return create(ThemeSchema, {
    schemaVersion: 1,
    name: "dark",
    tokens: create(TokensSchema, {
      palette: DARK_PALETTE,
      roles: DARK_ROLES,
      fonts: {
        body: create(FontSpecSchema, {
          family: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
        }),
        mono: create(FontSpecSchema, {
          family: "'Noto Sans Mono', ui-monospace, Menlo, Consolas, Liberation Mono, monospace"
        })
      },
      sizes: {
        stroke_thin: 1,
        font_small: 11,
        font_normal: 13,
        font_large: 16
      },
      dashes: {
        dashed: "5,4",
        dotted: "2,3"
      },
      shapePaths: {}
    }),
    defaultNodeComponent: "glyph",
    defaultEdgeComponent: "glyph",
    defaultGroupComponent: "glyph",
    defaultAnnotationComponent: "glyph",
    nodeComponents: [glyphNodeComponent()],
    edgeComponents: [glyphEdgeComponent()],
    groupComponents: [glyphGroupComponent()],
    annotationComponents: [glyphAnnotationComponent()]
  });
}
function lightTheme() {
  const tokens = create(TokensSchema, {
    palette: LIGHT_PALETTE,
    roles: LIGHT_ROLES,
    fonts: {
      body: create(FontSpecSchema, { family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }),
      mono: create(FontSpecSchema, { family: "'Noto Sans Mono', ui-monospace, Menlo, 'Cascadia Code', Consolas, monospace" })
    },
    sizes: {
      stroke_thin: 1,
      font_small: 11,
      font_normal: 13,
      font_large: 16
    },
    dashes: {
      dashed: "5,4",
      dotted: "2,3"
    },
    shapePaths: {}
  });
  return create(ThemeSchema, {
    schemaVersion: 1,
    name: "light",
    tokens,
    defaultNodeComponent: "glyph",
    defaultEdgeComponent: "glyph",
    defaultGroupComponent: "glyph",
    defaultAnnotationComponent: "glyph",
    nodeComponents: [glyphNodeComponent()],
    edgeComponents: [glyphEdgeComponent()],
    groupComponents: [glyphGroupComponent()],
    annotationComponents: [glyphAnnotationComponent()]
  });
}
function blueprintTheme() {
  return create(ThemeSchema, {
    schemaVersion: 1,
    name: "blueprint",
    tokens: create(TokensSchema, {
      palette: BLUEPRINT_PALETTE,
      roles: BLUEPRINT_ROLES,
      fonts: {
        body: create(FontSpecSchema, {
          family: "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
        }),
        mono: create(FontSpecSchema, {
          family: "'Noto Sans Mono', ui-monospace, Menlo, Consolas, Liberation Mono, monospace"
        })
      },
      sizes: {
        stroke_thin: 1,
        font_small: 11,
        font_normal: 13,
        font_large: 16
      },
      dashes: {
        dashed: "5,4",
        dotted: "2,3"
      },
      shapePaths: {}
    }),
    defaultNodeComponent: "glyph",
    defaultEdgeComponent: "glyph",
    defaultGroupComponent: "glyph",
    defaultAnnotationComponent: "glyph",
    nodeComponents: [blueprintNodeComponent()],
    edgeComponents: [blueprintEdgeComponent()],
    groupComponents: [blueprintGroupComponent()],
    annotationComponents: [glyphAnnotationComponent()]
  });
}
function getBundledTheme(name) {
  if (name === "dark")
    return darkTheme();
  if (name === "blueprint")
    return blueprintTheme();
  return lightTheme();
}
function findBundledTheme(name) {
  if (!BUNDLED_THEME_NAMES.includes(name))
    return null;
  return getBundledTheme(name);
}

// packages/ops/src/themes/resolve_themes.ts
var FALLBACK_BINDING = [["default", "dark"]];
async function resolveThemes(bindings, override, projectRoot) {
  const wanted = new Map(Object.keys(bindings).length > 0 ? Object.entries(bindings) : FALLBACK_BINDING);
  if (override !== undefined) {
    const eq = override.indexOf("=");
    if (eq < 0) {
      wanted.set("default", override);
    } else {
      const name = override.slice(0, eq);
      if (name === "") {
        return Err({ message: `--theme '${override}': expected <name>=<theme> or <theme>` });
      }
      wanted.set(name, override.slice(eq + 1));
    }
  }
  const loaded = new Map;
  for (const [name, ref] of wanted) {
    const bundled = findBundledTheme(ref);
    if (bundled !== null) {
      loaded.set(name, bundled);
      continue;
    }
    const text = await readFile(resolve(projectRoot, ref), "utf8");
    const result = await loadTheme(text);
    if (result.kind === "err") {
      return Err({ message: `theme '${name}' (${ref}): ${result.error.message}` });
    }
    loaded.set(name, result.value);
  }
  return Ok(loaded);
}

// packages/ops/src/render/op.ts
function deriveOutPath(diagramPath) {
  const ext = extname(diagramPath);
  const base = ext ? basename2(diagramPath, ext) + ".svg" : basename2(diagramPath) + ".svg";
  const dir = dirname2(diagramPath);
  return dir === "." ? base : join2(dir, base);
}
var renderOp = {
  name: "render",
  description: "Render a diagram file to SVG",
  params: renderParamsSchema,
  format: (o) => `wrote ${o.bytesWritten} bytes to ${o.outPath}`,
  async execute(params, ctx) {
    const diagramText = await readFile2(resolve2(ctx.projectRoot, params.diagram), "utf8");
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === "err") {
      throw init(new RenderOpError, { stage: "load", cause: diagramResult.error });
    }
    const stylePath = params.style !== undefined ? resolve2(ctx.projectRoot, params.style) : deriveDefaultStylePath(resolve2(ctx.projectRoot, params.diagram));
    let styleExists = params.style !== undefined;
    if (!styleExists) {
      styleExists = await access(stylePath).then(() => true, () => false);
    }
    let stylesheet;
    if (styleExists) {
      const styleText = await readFile2(stylePath, "utf8");
      const styleResult = await loadStylesheet(styleText);
      if (styleResult.kind === "err") {
        throw init(new RenderOpError, { stage: "load", cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }
    const themesResult = await resolveThemes(stylesheet?.themes ?? {}, params.theme, ctx.projectRoot);
    if (themesResult.kind === "err") {
      throw init(new RenderOpError, { stage: "load", cause: themesResult.error });
    }
    const themes = themesResult.value;
    let delta;
    if (params.delta !== undefined) {
      const deltaText = await readFile2(resolve2(ctx.projectRoot, params.delta), "utf8");
      const deltaResult = await loadDelta(deltaText);
      if (deltaResult.kind === "err") {
        throw init(new RenderOpError, { stage: "load", cause: deltaResult.error });
      }
      delta = deltaResult.value;
    }
    const seeded = delta === undefined ? seedComponentBindings(diagramResult.value, stylesheet ?? create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }), themes.get("default")) : stylesheet;
    const layoutEngine = new LayoutEngineImpl(new ElkAdapterImpl(createNodeElk()));
    const pipelineResult = await renderPipeline(diagramResult.value, seeded, themes, layoutEngine, delta);
    if (pipelineResult.kind === "err") {
      throw init(new RenderOpError, { stage: pipelineResult.error.stage, cause: pipelineResult.error });
    }
    const svg = pipelineResult.value;
    const outPath = resolve2(ctx.projectRoot, params.out ?? deriveOutPath(params.diagram));
    await writeFile(outPath, svg, "utf8");
    const bytesWritten = Buffer.byteLength(svg, "utf8");
    return init(new RenderOutput, { svg, outPath, bytesWritten });
  }
};

// packages/ops/src/validate/op.ts
import { access as access2, readFile as readFile3 } from "node:fs/promises";
import { resolve as resolve3 } from "node:path";

// packages/core/src/validator/validate_response/impl.ts
class ValidateResponse {
  violations;
}
// packages/core/src/validator/violation/impl.ts
var VIOLATION_KIND_ORDER = {
  ["ELEMENT_CYCLE" /* ELEMENT_CYCLE */]: 0,
  ["EDGE_SOURCE_MISSING" /* EDGE_SOURCE_MISSING */]: 1,
  ["EDGE_TARGET_MISSING" /* EDGE_TARGET_MISSING */]: 2,
  ["EDGE_ENDPOINT_NOT_ENTITY" /* EDGE_ENDPOINT_NOT_ENTITY */]: 3,
  ["ELEMENT_PARENT_MISSING" /* ELEMENT_PARENT_MISSING */]: 4,
  ["STYLE_TARGET_IS_BUNDLE" /* STYLE_TARGET_IS_BUNDLE */]: 5,
  ["STYLE_TARGET_MISSING" /* STYLE_TARGET_MISSING */]: 6,
  ["RENDER_MODE_DISSOLVED_ON_ENTITY" /* RENDER_MODE_DISSOLVED_ON_ENTITY */]: 7,
  ["OPEN_DEPTH_TOO_SMALL" /* OPEN_DEPTH_TOO_SMALL */]: 8,
  ["ANNOTATION_ANCHOR_MISSING" /* ANNOTATION_ANCHOR_MISSING */]: 9,
  ["ID_CONTROL_CHARACTER" /* ID_CONTROL_CHARACTER */]: 10
};

class Violation {
  kind;
  location;
  message;
}
// packages/core/src/validator/validator/impl.ts
class ValidatorImpl {
  validate(request) {
    const graph = request.diagram.graph;
    const elementsMap = graph !== undefined ? graph.elements : {};
    const edgesMap = graph !== undefined ? graph.edges : {};
    const sortedKeys = (obj) => Object.keys(obj).sort();
    const normParent = (raw) => {
      if (raw === undefined || raw === "") {
        return;
      } else {
        return raw;
      }
    };
    const violations = [];
    const idKinds = [["element", elementsMap], ["edge", edgesMap]];
    for (const [label, ids] of idKinds) {
      for (const id of sortedKeys(ids)) {
        if (hasControlCharacter(id)) {
          violations.push(init(new Violation, {
            kind: "ID_CONTROL_CHARACTER" /* ID_CONTROL_CHARACTER */,
            location: id,
            message: `${label} id ${JSON.stringify(id)} contains a control character, which an SVG attribute cannot carry`
          }));
        }
      }
    }
    const sortedEdgeIds = sortedKeys(edgesMap);
    for (const id of sortedEdgeIds) {
      const edge = edgesMap[id];
      const source = elementsMap[edge.source];
      if (source === undefined) {
        violations.push(init(new Violation, {
          kind: "EDGE_SOURCE_MISSING" /* EDGE_SOURCE_MISSING */,
          location: id,
          message: `edge '${id}' source '${edge.source}' does not reference an existing entity element`
        }));
      } else if (source.role === 2 /* GROUPING */) {
        violations.push(init(new Violation, {
          kind: "EDGE_ENDPOINT_NOT_ENTITY" /* EDGE_ENDPOINT_NOT_ENTITY */,
          location: id,
          message: `edge '${id}' source '${edge.source}' is a grouping element`
        }));
      }
      const target = elementsMap[edge.target];
      if (target === undefined) {
        violations.push(init(new Violation, {
          kind: "EDGE_TARGET_MISSING" /* EDGE_TARGET_MISSING */,
          location: id,
          message: `edge '${id}' target '${edge.target}' does not reference an existing entity element`
        }));
      } else if (target.role === 2 /* GROUPING */) {
        violations.push(init(new Violation, {
          kind: "EDGE_ENDPOINT_NOT_ENTITY" /* EDGE_ENDPOINT_NOT_ENTITY */,
          location: id,
          message: `edge '${id}' target '${edge.target}' is a grouping element`
        }));
      }
    }
    const sortedElementIds = sortedKeys(elementsMap);
    for (const id of sortedElementIds) {
      const element = elementsMap[id];
      const p = normParent(element.parent);
      if (p !== undefined && elementsMap[p] === undefined) {
        violations.push(init(new Violation, {
          kind: "ELEMENT_PARENT_MISSING" /* ELEMENT_PARENT_MISSING */,
          location: id,
          message: `element '${id}' parent '${p}' does not reference an existing element`
        }));
      } else {}
    }
    const colors = new Map;
    for (const id of sortedElementIds) {
      colors.set(id, "white");
    }
    const dfs = (id, stack) => {
      colors.set(id, "gray");
      stack.push(id);
      const element = elementsMap[id];
      const parentId = normParent(element.parent);
      if (parentId !== undefined && elementsMap[parentId] !== undefined) {
        const parentColor = colors.get(parentId);
        if (parentColor === "gray") {
          const cycleStart = stack.indexOf(parentId);
          const cyclePath = stack.slice(cycleStart);
          cyclePath.push(parentId);
          const location = cyclePath.join(", ");
          violations.push(init(new Violation, {
            kind: "ELEMENT_CYCLE" /* ELEMENT_CYCLE */,
            location,
            message: `element cycle detected: ${location}`
          }));
        } else if (parentColor === "white") {
          dfs(parentId, stack);
        } else {}
      } else {}
      stack.pop();
      colors.set(id, "black");
    };
    for (const id of sortedElementIds) {
      if (colors.get(id) === "white") {
        dfs(id, []);
      } else {}
    }
    const stylesheet = request.stylesheet;
    if (stylesheet !== undefined) {
      const checkStyleTargets = (entries, targets, kindLabel) => {
        for (const key of sortedKeys(entries)) {
          if (targets[key] === undefined) {
            violations.push(init(new Violation, {
              kind: "STYLE_TARGET_MISSING" /* STYLE_TARGET_MISSING */,
              location: key,
              message: `stylesheet styles ${kindLabel} '${key}', which the graph does not define`
            }));
          }
        }
      };
      checkStyleTargets(stylesheet.elements, elementsMap, "element");
      const authoredEdgeStyles = {};
      for (const key of sortedKeys(stylesheet.edges)) {
        if (key.startsWith("bundle:") && edgesMap[key] === undefined) {
          violations.push(init(new Violation, {
            kind: "STYLE_TARGET_IS_BUNDLE" /* STYLE_TARGET_IS_BUNDLE */,
            location: key,
            message: `stylesheet styles derived bundle '${key}', which cannot be styled`
          }));
        } else {
          authoredEdgeStyles[key] = stylesheet.edges[key];
        }
      }
      checkStyleTargets(authoredEdgeStyles, edgesMap, "edge");
      for (const key of sortedKeys(stylesheet.elements)) {
        const entry = stylesheet.elements[key];
        const element = elementsMap[key];
        if (entry !== undefined && element !== undefined && entry.renderMode === 2 /* DISSOLVED */ && element.role !== 2 /* GROUPING */) {
          violations.push(init(new Violation, {
            kind: "RENDER_MODE_DISSOLVED_ON_ENTITY" /* RENDER_MODE_DISSOLVED_ON_ENTITY */,
            location: key,
            message: `element '${key}' has dissolved render mode but is not grouping`
          }));
        }
      }
      if (stylesheet.openDepth !== undefined && stylesheet.openDepth < 1) {
        violations.push(init(new Violation, {
          kind: "OPEN_DEPTH_TOO_SMALL" /* OPEN_DEPTH_TOO_SMALL */,
          location: "openDepth",
          message: `stylesheet openDepth must be at least 1`
        }));
      }
      for (const key of sortedKeys(stylesheet.annotations)) {
        const anchor = stylesheet.annotations[key].anchor;
        if (anchor === undefined) {
          continue;
        }
        const targets = anchor.refKind === 1 /* ELEMENT */ ? elementsMap : anchor.refKind === 2 /* EDGE */ ? edgesMap : undefined;
        if (targets === undefined || targets[anchor.refId] === undefined) {
          violations.push(init(new Violation, {
            kind: "ANNOTATION_ANCHOR_MISSING" /* ANNOTATION_ANCHOR_MISSING */,
            location: key,
            message: `annotation '${key}' anchors to '${anchor.refId}', which the graph does not define`
          }));
        }
      }
    }
    violations.sort((a, b) => {
      const kindDiff = VIOLATION_KIND_ORDER[a.kind] - VIOLATION_KIND_ORDER[b.kind];
      if (kindDiff !== 0) {
        return kindDiff;
      } else {
        return a.location < b.location ? -1 : a.location > b.location ? 1 : 0;
      }
    });
    return Ok(init(new ValidateResponse, { violations }));
  }
}
// packages/core/src/validator/validate_request/impl.ts
class ValidateRequest {
  diagram;
  stylesheet;
}
// packages/ops/src/validate/validate_params.ts
var validateParamsSchema = exports_external.object({
  diagram: exports_external.string().describe("Path to the .arch diagram file to validate."),
  style: exports_external.string().optional().describe("Path to a .style stylesheet; uses the diagram default if omitted."),
  theme: exports_external.string().optional().describe("Bundled theme name (light, dark, blueprint) or path to a .theme.json file; uses the bundled dark theme if omitted.")
});

// packages/ops/src/validate/validate_output.ts
class ValidateOutput {
  violations;
  passed;
  stagesRun;
}

// packages/ops/src/validate/validate_op_error.ts
class ValidateOpError extends Error {
  stage;
  cause;
}

// packages/ops/src/validate/op.ts
var validateOp = {
  name: "validate",
  description: "Validate a diagram file for structural correctness",
  params: validateParamsSchema,
  format: (o) => o.passed ? "diagram is valid" : `${o.violations.length} violation(s) found`,
  exitCode: (o) => o.passed ? 0 : 1,
  async execute(params, ctx) {
    const stagesRun = [];
    const diagramText = await readFile3(resolve3(ctx.projectRoot, params.diagram), "utf8");
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === "err") {
      throw init(new ValidateOpError, { stage: "load", cause: diagramResult.error });
    }
    stagesRun.push("load");
    const stylePath = params.style !== undefined ? resolve3(ctx.projectRoot, params.style) : deriveDefaultStylePath(resolve3(ctx.projectRoot, params.diagram));
    let styleExists = params.style !== undefined;
    if (!styleExists) {
      styleExists = await access2(stylePath).then(() => true, () => false);
    }
    let stylesheet;
    if (styleExists) {
      const styleText = await readFile3(stylePath, "utf8");
      const styleResult = await loadStylesheet(styleText);
      if (styleResult.kind === "err") {
        throw init(new ValidateOpError, { stage: "load", cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }
    const validateResult = new ValidatorImpl().validate(init(new ValidateRequest, { diagram: diagramResult.value, stylesheet }));
    if (validateResult.kind === "err") {
      throw init(new ValidateOpError, { stage: "validate", cause: validateResult.error });
    }
    stagesRun.push("validate");
    const themesResult = await resolveThemes(stylesheet?.themes ?? {}, params.theme, ctx.projectRoot);
    if (themesResult.kind === "err") {
      throw init(new ValidateOpError, { stage: "load", cause: themesResult.error });
    }
    const themes = themesResult.value;
    const seeded = seedComponentBindings(diagramResult.value, stylesheet ?? create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION }), themes.get("default"));
    const resolveResult = await resolvePipeline(diagramResult.value, seeded, themes);
    if (resolveResult.kind === "err") {
      throw init(new ValidateOpError, { stage: resolveResult.error.stage, cause: resolveResult.error });
    }
    stagesRun.push("resolve");
    const violations = validateResult.value.violations;
    const passed = violations.length === 0;
    return init(new ValidateOutput, { violations, passed, stagesRun });
  }
};

// packages/ops/src/format/op.ts
import { readFile as readFile4 } from "node:fs/promises";
import { resolve as resolve4 } from "node:path";

// packages/ops/src/format/format_params.ts
var formatParamsSchema = exports_external.object({
  file: exports_external.string().describe("Path to the file to format (.diag.json, .style.json, or .theme.json).")
});

// packages/ops/src/format/format_output.ts
class FormatOutput {
  json;
}

// packages/ops/src/format/format_op_error.ts
class FormatOpError extends Error {
  stage;
  cause;
}

// packages/ops/src/format/op.ts
var formatOp = {
  name: "format",
  description: "Pretty-print a diagram, stylesheet, or theme file as canonical JSON",
  params: formatParamsSchema,
  format: (o) => o.json,
  exitCode: (_o) => 0,
  async execute(params, ctx) {
    const absPath = resolve4(ctx.projectRoot, params.file);
    const text = await readFile4(absPath, "utf8").catch((err) => {
      throw init(new FormatOpError, { stage: "dispatch", cause: err });
    });
    let json;
    if (params.file.endsWith(".diag.json")) {
      const result = await loadDiagram(text);
      if (result.kind === "err") {
        throw init(new FormatOpError, { stage: "parse", cause: result.error });
      }
      json = toJson2(DiagramSchema, result.value);
    } else if (params.file.endsWith(".style.json")) {
      const result = await loadStylesheet(text);
      if (result.kind === "err") {
        throw init(new FormatOpError, { stage: "parse", cause: result.error });
      }
      json = toJson2(StylesheetSchema, result.value);
    } else if (params.file.endsWith(".theme.json")) {
      const result = await loadTheme(text);
      if (result.kind === "err") {
        throw init(new FormatOpError, { stage: "parse", cause: result.error });
      }
      json = toJson2(ThemeSchema, result.value);
    } else {
      throw init(new FormatOpError, {
        stage: "dispatch",
        cause: new Error(`unrecognised extension: ${params.file}`)
      });
    }
    return init(new FormatOutput, { json });
  }
};

// packages/ops/src/init/op.ts
import { access as access3, writeFile as writeFile2 } from "node:fs/promises";
import { resolve as resolve5 } from "node:path";

// packages/ops/src/init/init_params.ts
var rawInitParamsSchema = exports_external.object({
  name: exports_external.string().default("diagram")
});
var initParamsSchema = rawInitParamsSchema;

// packages/ops/src/init/init_output.ts
class InitOutput {
  path;
}

// packages/ops/src/init/init_op_error.ts
class InitOpError extends Error {
  stage;
  cause;
}

// packages/ops/src/init/op.ts
var initOp = {
  name: "init",
  description: "Scaffold a new diagram file",
  params: initParamsSchema,
  format: (o) => `wrote ${o.path}`,
  exitCode: () => 0,
  async execute(params, ctx) {
    const path = resolve5(ctx.projectRoot, `${params.name}.diag.json`);
    let exists;
    try {
      await access3(path);
      exists = true;
    } catch {
      exists = false;
    }
    if (exists) {
      throw init(new InitOpError, { stage: "exists", cause: undefined });
    }
    const en = (source) => [create(LocalizationSchema, { locale: "en", source })];
    const msg = create(DiagramSchema, {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      id: params.name,
      title: en(params.name),
      graph: create(GraphSchema, {
        elements: {
          first: create(ElementSchema, { label: en("first") }),
          second: create(ElementSchema, { label: en("second") })
        },
        edges: {
          first__second: create(EdgeSchema, { source: "first", target: "second" })
        }
      }),
      metadata: { generator: "archeglyph init", canonicalLocale: "en" }
    });
    const json = toJson2(DiagramSchema, msg);
    try {
      await writeFile2(path, json, "utf8");
    } catch (e) {
      throw init(new InitOpError, { stage: "write", cause: e });
    }
    return init(new InitOutput, { path });
  }
};

// packages/ops/src/bind/op.ts
import { access as access4, readFile as readFile5, writeFile as writeFile3 } from "node:fs/promises";
import { resolve as resolve6 } from "node:path";

// packages/ops/src/bind/bind_params.ts
var rawBindParamsSchema = exports_external.object({
  diagram: exports_external.string(),
  style: exports_external.string().optional(),
  where: exports_external.string(),
  elementType: exports_external.enum(["node", "edge", "group"]).default("node"),
  component: exports_external.string()
});
var bindParamsSchema = rawBindParamsSchema;

// packages/ops/src/bind/bind_output.ts
class BindOutput {
  matched;
  path;
  component;
}

// packages/ops/src/bind/bind_op_error.ts
class BindOpError extends Error {
  stage;
  cause;
}

// packages/ops/src/bind/predicate.ts
function parsePredicate(expr) {
  const parts = expr.split("&&").map((s) => s.trim());
  const predicates = parts.map(parseClause);
  return (a0) => predicates.every((p) => p(a0));
}
function parseClause(clause) {
  const tagEq = /^tags\.(\w+)\s*==\s*'([^']*)'$/.exec(clause);
  if (tagEq !== null) {
    const key = tagEq[1];
    const val = tagEq[2];
    return (a0) => a0.tags[key] === val;
  }
  const parentEq = /^parent_group\s*==\s*'([^']*)'$/.exec(clause);
  if (parentEq !== null) {
    const val = parentEq[1];
    return (a0) => a0.parent_group === val;
  }
  const idSw = /^id\s+startsWith\s+'([^']*)'$/.exec(clause);
  if (idSw !== null) {
    const prefix = idSw[1];
    return (a0) => a0.id.startsWith(prefix);
  }
  throw new Error(`parsePredicate: unrecognised clause: ${clause}`);
}

// packages/ops/src/bind/op.ts
var bindOp = {
  name: "bind",
  description: "Bind a theme component to matching diagram elements in a stylesheet",
  params: bindParamsSchema,
  format: (o) => `${o.matched} element(s) bound to '${o.component}' in ${o.path}`,
  exitCode: () => 0,
  async execute(params, ctx) {
    const diagramPath = resolve6(ctx.projectRoot, params.diagram);
    const diagramText = await readFile5(diagramPath, "utf8").catch((err) => {
      throw init(new BindOpError, { stage: "load_diagram", cause: err });
    });
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === "err") {
      throw init(new BindOpError, { stage: "load_diagram", cause: diagramResult.error });
    }
    const diagram = diagramResult.value;
    const stylePath = params.style !== undefined ? resolve6(ctx.projectRoot, params.style) : deriveDefaultStylePath(diagramPath);
    let styleExists;
    try {
      await access4(stylePath);
      styleExists = true;
    } catch {
      styleExists = false;
    }
    let stylesheet;
    if (styleExists) {
      const styleText = await readFile5(stylePath, "utf8").catch((err) => {
        throw init(new BindOpError, { stage: "load_style", cause: err });
      });
      const styleResult = await loadStylesheet(styleText);
      if (styleResult.kind === "err") {
        throw init(new BindOpError, { stage: "load_style", cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    } else {
      stylesheet = create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION });
    }
    let predicate;
    try {
      predicate = parsePredicate(params.where);
    } catch (err) {
      throw init(new BindOpError, { stage: "parse_predicate", cause: err });
    }
    const graph = diagram.graph;
    let matched = 0;
    const elements = graph?.elements ?? {};
    const children = childrenIndex(elements);
    if (params.elementType === "node") {
      for (const [id, element] of Object.entries(elements)) {
        if (!isGroupLike(elements, children, id) && predicate({ id, tags: element.tags, parent_group: element.parent })) {
          const entry = stylesheet.elements[id] ?? create(ElementStyleEntrySchema, {});
          entry.component = params.component;
          stylesheet.elements[id] = entry;
          matched++;
        }
      }
    } else if (params.elementType === "edge") {
      for (const [id, edge] of Object.entries(graph?.edges ?? {})) {
        if (predicate({ id, tags: edge.tags, parent_group: undefined })) {
          const entry = stylesheet.edges[id] ?? create(EdgeStyleEntrySchema, {});
          entry.component = params.component;
          stylesheet.edges[id] = entry;
          matched++;
        }
      }
    } else {
      for (const [id, element] of Object.entries(elements)) {
        if (isGroupLike(elements, children, id) && predicate({ id, tags: element.tags, parent_group: element.parent })) {
          const entry = stylesheet.elements[id] ?? create(ElementStyleEntrySchema, {});
          entry.boxComponent = params.component;
          stylesheet.elements[id] = entry;
          matched++;
        }
      }
    }
    await writeFile3(stylePath, toJson2(StylesheetSchema, stylesheet), "utf8").catch((err) => {
      throw init(new BindOpError, { stage: "write", cause: err });
    });
    return init(new BindOutput, { matched, path: stylePath, component: params.component });
  }
};

// packages/ops/src/watch/op.ts
import { watch } from "node:fs";
import { resolve as resolve7 } from "node:path";

// packages/ops/src/watch/watch_params.ts
var watchParamsSchema = exports_external.object({
  diagram: exports_external.string().describe("Path to the .arch diagram file to watch and re-render on changes."),
  style: exports_external.string().optional().describe("Path to a .style stylesheet; uses the diagram default if omitted."),
  theme: exports_external.string().optional().describe("Path to a .theme.json file; uses the bundled light theme if omitted."),
  out: exports_external.string().optional().describe("Output SVG path; defaults to the diagram path with a .svg extension.")
});

// packages/ops/src/watch/watch_output.ts
class WatchOutput {
  cyclesCompleted;
  path;
}

// packages/ops/src/watch/watch_op_error.ts
class WatchOpError extends Error {
  stage;
  cause;
}

// packages/ops/src/watch/op.ts
var watchOp = {
  name: "watch",
  description: "Watch a diagram file and re-render on changes",
  params: watchParamsSchema,
  format: (o) => `watched ${o.path} — ${o.cyclesCompleted} render(s) completed`,
  async execute(params, ctx) {
    const renderParams = init(new RenderParams, {
      diagram: params.diagram,
      style: params.style,
      theme: params.theme,
      out: params.out
    });
    try {
      await renderOp.execute(renderParams, ctx);
    } catch (err) {
      throw init(new WatchOpError, { stage: "initial_render", cause: err });
    }
    let cyclesCompleted = 1;
    const watchPaths = [resolve7(ctx.projectRoot, params.diagram)];
    if (params.style !== undefined)
      watchPaths.push(resolve7(ctx.projectRoot, params.style));
    if (params.theme !== undefined)
      watchPaths.push(resolve7(ctx.projectRoot, params.theme));
    return new Promise((done) => {
      const watchers = [];
      let debounceTimer;
      const cleanup = () => {
        if (debounceTimer !== undefined)
          clearTimeout(debounceTimer);
        for (const watcher of watchers)
          watcher.close();
        done(init(new WatchOutput, { cyclesCompleted, path: params.diagram }));
      };
      const onSettle = async () => {
        try {
          await renderOp.execute(renderParams, ctx);
          cyclesCompleted += 1;
        } catch (err) {
          ctx.logger.error(String(err));
        }
      };
      const onEvent = () => {
        if (debounceTimer !== undefined)
          clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = undefined;
          onSettle();
        }, 100);
      };
      process.once("SIGINT", cleanup);
      try {
        for (const p of watchPaths) {
          watchers.push(watch(p, onEvent));
        }
      } catch (err) {
        process.off("SIGINT", cleanup);
        for (const watcher of watchers)
          watcher.close();
        throw init(new WatchOpError, { stage: "setup_watch", cause: err });
      }
    });
  },
  exitCode: () => 0
};

// packages/ops/src/diff/op.ts
import { readFile as readFile6, writeFile as writeFile4 } from "node:fs/promises";
import { relative, resolve as resolve8 } from "node:path";

// packages/core/src/diff/diff.ts
function diff(base, target, options) {
  const baseElements = base.graph !== undefined ? base.graph.elements : {};
  const targetElements = target.graph !== undefined ? target.graph.elements : {};
  const baseEdges = base.graph !== undefined ? base.graph.edges : {};
  const targetEdges = target.graph !== undefined ? target.graph.edges : {};
  const includeUnchanged = options !== undefined && options.includeUnchanged === true;
  const elementDeltas = [];
  const elementIds = Array.from(new Set([...Object.keys(baseElements), ...Object.keys(targetElements)])).sort();
  for (const elementId of elementIds) {
    const before = baseElements[elementId];
    const after = targetElements[elementId];
    if (before === undefined && after !== undefined) {
      elementDeltas.push(create(ElementDeltaSchema, {
        elementId,
        changeType: 2 /* ADDED */,
        after
      }));
    } else if (before !== undefined && after === undefined) {
      elementDeltas.push(create(ElementDeltaSchema, {
        elementId,
        changeType: 3 /* DELETED */,
        before
      }));
    } else if (before !== undefined && after !== undefined && !equals(ElementSchema, before, after)) {
      elementDeltas.push(create(ElementDeltaSchema, {
        elementId,
        changeType: 4 /* MODIFIED */,
        before,
        after
      }));
    } else if (includeUnchanged && before !== undefined && after !== undefined) {
      elementDeltas.push(create(ElementDeltaSchema, {
        elementId,
        changeType: 1 /* UNCHANGED */,
        before,
        after
      }));
    }
  }
  const edgeDeltas = [];
  const edgeIds = Array.from(new Set([...Object.keys(baseEdges), ...Object.keys(targetEdges)])).sort();
  for (const edgeId of edgeIds) {
    const before = baseEdges[edgeId];
    const after = targetEdges[edgeId];
    if (before === undefined && after !== undefined) {
      edgeDeltas.push(create(EdgeDeltaSchema, {
        edgeId,
        changeType: 2 /* ADDED */,
        after
      }));
    } else if (before !== undefined && after === undefined) {
      edgeDeltas.push(create(EdgeDeltaSchema, {
        edgeId,
        changeType: 3 /* DELETED */,
        before
      }));
    } else if (before !== undefined && after !== undefined && !equals(EdgeSchema, before, after)) {
      edgeDeltas.push(create(EdgeDeltaSchema, {
        edgeId,
        changeType: 4 /* MODIFIED */,
        before,
        after
      }));
    } else if (includeUnchanged && before !== undefined && after !== undefined) {
      edgeDeltas.push(create(EdgeDeltaSchema, {
        edgeId,
        changeType: 1 /* UNCHANGED */,
        before,
        after
      }));
    }
  }
  return create(DeltaSchema, {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    baseRef: base.id,
    targetRef: target.id,
    edgeDeltas,
    elementDeltas
  });
}
// packages/ops/src/diff/diff_params.ts
var diffParamsSchema = exports_external.object({
  base: exports_external.string().describe("Path to the diagram file to compare FROM."),
  target: exports_external.string().describe("Path to the diagram file to compare TO."),
  out: exports_external.string().optional().describe("Path to write the Delta JSON to; prints the summary only if omitted."),
  includeUnchanged: exports_external.boolean().optional().describe("Emit an UNCHANGED entry for every element that did not change, rather than omitting it.")
});

// packages/ops/src/diff/diff_output.ts
class DiffCounts {
  added;
  deleted;
  modified;
}

class DiffOutput {
  baseRef;
  targetRef;
  elements;
  edges;
  changed;
  outPath;
}

// packages/ops/src/diff/diff_op_error.ts
class DiffOpError extends Error {
  stage;
  cause;
}

// packages/ops/src/diff/op.ts
function countBy(entries) {
  const of = (want) => entries.filter((entry) => entry.changeType === want).length;
  return init(new DiffCounts, {
    added: of(2 /* ADDED */),
    deleted: of(3 /* DELETED */),
    modified: of(4 /* MODIFIED */)
  });
}
function line(label, counts) {
  const total = counts.added + counts.deleted + counts.modified;
  return total === 0 ? undefined : `${label}: +${counts.added} -${counts.deleted} ~${counts.modified}`;
}
async function read(path, ctx) {
  const text = await readFile6(resolve8(ctx.projectRoot, path), "utf8");
  const result = await loadDiagram(text);
  if (result.kind === "err") {
    throw init(new DiffOpError, { stage: "load", cause: result.error });
  }
  return result.value;
}
var diffOp = {
  name: "diff",
  description: "Compare two diagram files and emit the change set between them",
  params: diffParamsSchema,
  format: (o) => {
    if (!o.changed) {
      return `no changes between ${o.baseRef} and ${o.targetRef}`;
    }
    const parts = [line("elements", o.elements), line("edges", o.edges)].filter((part) => part !== undefined);
    const written = o.outPath === undefined ? "" : `
wrote ${o.outPath}`;
    return `${o.baseRef} -> ${o.targetRef}
${parts.join(`
`)}${written}`;
  },
  exitCode: () => 0,
  async execute(params, ctx) {
    const base = await read(params.base, ctx);
    const target = await read(params.target, ctx);
    const delta = diff(base, target, { includeUnchanged: params.includeUnchanged === true });
    delta.baseRef = params.base;
    delta.targetRef = params.target;
    let outPath;
    if (params.out !== undefined) {
      const absolute = resolve8(ctx.projectRoot, params.out);
      await writeFile4(absolute, `${toJson2(DeltaSchema, delta)}
`, "utf8");
      const nearby = relative(ctx.projectRoot, absolute);
      outPath = nearby.startsWith("..") ? absolute : nearby;
    }
    const elements = countBy(delta.elementDeltas);
    const edges = countBy(delta.edgeDeltas);
    const changed = [elements, edges].some((counts) => counts.added + counts.deleted + counts.modified > 0);
    return init(new DiffOutput, {
      baseRef: delta.baseRef,
      targetRef: delta.targetRef,
      elements,
      edges,
      changed,
      outPath
    });
  }
};

// packages/ops/src/open/op.ts
import { access as access5, readFile as readFile7, writeFile as writeFile5 } from "node:fs/promises";
import { resolve as resolve9 } from "node:path";

// packages/core/src/resolver/focus/impl.ts
function openSet(elements, picks, depth) {
  const children = childrenIndex(elements);
  const open = new Set;
  const openBelow = (id, level) => {
    const inside = children.get(id);
    if (level >= depth || inside === undefined) {
      return;
    }
    open.add(id);
    for (const child of inside) {
      openBelow(child, level + 1);
    }
  };
  for (const pick of picks) {
    if (elements[pick] === undefined) {
      continue;
    }
    const seen = new Set([pick]);
    let above = elements[pick].parent;
    while (above !== undefined && above !== "" && !seen.has(above)) {
      seen.add(above);
      open.add(above);
      above = elements[above]?.parent;
    }
    openBelow(pick, 0);
  }
  return open;
}
function hiddenOutside(elements, filtered, picks, hops) {
  const visible = new Map;
  for (const node of Object.values(filtered.nodes)) {
    visible.set(node.id, node.parentGroup);
  }
  for (const group of Object.values(filtered.groups)) {
    visible.set(group.id, group.parentGroup);
  }
  const pickSet = new Set(picks);
  const insidePick = (id) => {
    const seen = new Set;
    for (let at = id;at !== undefined && at !== "" && !seen.has(at); at = elements[at]?.parent) {
      if (pickSet.has(at)) {
        return true;
      }
      seen.add(at);
    }
    return false;
  };
  const touching = new Map;
  const link = (from, to) => {
    const set = touching.get(from);
    if (set === undefined) {
      touching.set(from, new Set([to]));
    } else {
      set.add(to);
    }
  };
  for (const edge of Object.values(filtered.edges)) {
    if (edge.source !== edge.target) {
      link(edge.source, edge.target);
      link(edge.target, edge.source);
    }
  }
  let ring = [...visible.keys()].filter(insidePick).sort();
  const reached = new Set(ring);
  for (let hop = 0;hop < hops; hop++) {
    const next = [];
    for (const id of ring) {
      for (const other of [...touching.get(id) ?? []].sort()) {
        if (!reached.has(other)) {
          reached.add(other);
          next.push(other);
        }
      }
    }
    ring = next;
  }
  const kept = new Set(reached);
  for (const id of reached) {
    for (let above = visible.get(id);above !== undefined && !kept.has(above); above = visible.get(above)) {
      kept.add(above);
    }
  }
  const topOfHidden = (id) => {
    const above = visible.get(id);
    return !kept.has(id) && (above === undefined || kept.has(above));
  };
  return [...visible.keys()].filter(topOfHidden).sort();
}
// packages/ops/src/open/open_op_error.ts
class OpenOpError extends Error {
  stage;
  cause;
}

// packages/ops/src/open/open_output.ts
class OpenOutput {
  opened;
  picks;
  hidden;
  depth;
  path;
}

// packages/ops/src/open/open_params.ts
var rawOpenParamsSchema = exports_external.object({
  diagram: exports_external.string().describe("The diagram to choose a view of"),
  style: exports_external.string().optional().describe("The stylesheet to write; default: the one beside the diagram"),
  id: exports_external.array(exports_external.string()).min(1).describe("An element to look at; repeat the flag to pick several"),
  depth: exports_external.number().int().min(0).default(1).describe("How many levels of each pick to open: 0 leaves it one closed block, 1 opens it with its contents as blocks, 2 opens those too"),
  hops: exports_external.number().int().min(0).optional().describe("Show only the picks and what is within this many edges of them, as drawn; 0 is the picks alone. Default: show everything"),
  kind: exports_external.array(exports_external.string()).optional().describe("Draw only edges of this kind; repeat the flag for several. Other edges are left out, and --hops follows only these. Default: every kind")
});
var openParamsSchema = rawOpenParamsSchema;

// packages/ops/src/open/op.ts
var openOp = {
  name: "open",
  description: "Choose a view of a diagram: open the elements you name, to a depth, and leave the rest as closed blocks",
  params: openParamsSchema,
  format: (o) => `${o.opened} element(s) opened for ${o.picks} pick(s) at depth ${o.depth}` + `${o.hidden > 0 ? `, ${o.hidden} hidden` : ""} in ${o.path}`,
  exitCode: () => 0,
  async execute(params, ctx) {
    const diagramPath = resolve9(ctx.projectRoot, params.diagram);
    const diagramText = await readFile7(diagramPath, "utf8").catch((err) => {
      throw init(new OpenOpError, { stage: "load_diagram", cause: err });
    });
    const diagramResult = await loadDiagram(diagramText);
    if (diagramResult.kind === "err") {
      throw init(new OpenOpError, { stage: "load_diagram", cause: diagramResult.error });
    }
    const elements = diagramResult.value.graph?.elements ?? {};
    const unknown = params.id.filter((id) => elements[id] === undefined);
    if (unknown.length > 0) {
      throw init(new OpenOpError, {
        stage: "unknown_id",
        cause: new Error(`no such element: ${unknown.map((id) => `'${id}'`).join(", ")}`)
      });
    }
    const stylePath = params.style !== undefined ? resolve9(ctx.projectRoot, params.style) : deriveDefaultStylePath(diagramPath);
    const styleExists = await access5(stylePath).then(() => true, () => false);
    let stylesheet = create(StylesheetSchema, { schemaVersion: STYLE_SCHEMA_VERSION });
    if (styleExists) {
      const styleText = await readFile7(stylePath, "utf8").catch((err) => {
        throw init(new OpenOpError, { stage: "load_style", cause: err });
      });
      const styleResult = await loadStylesheet(styleText);
      if (styleResult.kind === "err") {
        throw init(new OpenOpError, { stage: "load_style", cause: styleResult.error });
      }
      stylesheet = styleResult.value;
    }
    for (const entry of Object.values(stylesheet.elements)) {
      entry.visibility = undefined;
      if (entry.renderMode !== 2 /* DISSOLVED */) {
        entry.renderMode = undefined;
      }
    }
    stylesheet.openDepth = 1;
    stylesheet.shownEdgeKinds = params.kind ?? [];
    const open = [...openSet(elements, params.id, params.depth)].filter((id) => stylesheet.elements[id]?.renderMode !== 2 /* DISSOLVED */);
    for (const id of open) {
      const entry = stylesheet.elements[id] ?? create(ElementStyleEntrySchema, {});
      entry.renderMode = 1 /* OPEN */;
      stylesheet.elements[id] = entry;
    }
    let hidden = [];
    if (params.hops !== undefined) {
      const drawn = new VisibilityFilterImpl().filter(init(new FilterRequest, {
        diagram: diagramResult.value,
        stylesheet
      }));
      if (drawn.kind === "err") {
        throw init(new OpenOpError, { stage: "resolve", cause: drawn.error });
      }
      hidden = hiddenOutside(elements, drawn.value, params.id, params.hops);
      for (const id of hidden) {
        const entry = stylesheet.elements[id] ?? create(ElementStyleEntrySchema, {});
        entry.visibility = 1 /* HIDDEN */;
        stylesheet.elements[id] = entry;
      }
    }
    await writeFile5(stylePath, toJson2(StylesheetSchema, stylesheet), "utf8").catch((err) => {
      throw init(new OpenOpError, { stage: "write", cause: err });
    });
    return init(new OpenOutput, { opened: open.length, picks: params.id.length, depth: params.depth, hidden: hidden.length, path: stylePath });
  }
};

// packages/ops/src/registry.ts
var REGISTRY = [
  renderOp,
  validateOp,
  formatOp,
  initOp,
  bindOp,
  watchOp,
  diffOp,
  openOp
];
// packages/ops/src/zod_argv.ts
import { parseArgs } from "node:util";
function toKebabCase(key) {
  let result = "";
  for (let i = 0;i < key.length; i++) {
    const ch = key[i];
    const isUpper = ch >= "A" && ch <= "Z";
    const sep = isUpper && i > 0 ? "-" : "";
    const lower = isUpper ? ch.toLowerCase() : ch;
    result = result + sep + lower;
  }
  return result;
}
function toCamelCase(key) {
  const parts = key.split("-");
  let result = parts[0];
  for (let i = 1;i < parts.length; i++) {
    const part = parts[i];
    const capitalized = part.length > 0 ? part[0].toUpperCase() + part.slice(1) : "";
    result = result + capitalized;
  }
  return result;
}
function unwrapField(schema) {
  const typeName = schema._def.typeName;
  if (typeName === "ZodOptional" || typeName === "ZodDefault") {
    return unwrapField(schema._def.innerType);
  } else {
    return schema;
  }
}
function getTypeLabel(innerTypeName, inner) {
  if (innerTypeName === "ZodString") {
    return "string";
  } else if (innerTypeName === "ZodNumber") {
    return "number";
  } else if (innerTypeName === "ZodBoolean") {
    return "boolean";
  } else if (innerTypeName === "ZodEnum") {
    const vals = inner._def.values;
    return "enum<" + vals.join("|") + ">";
  } else if (innerTypeName === "ZodArray") {
    return "string[]";
  } else {
    return "string";
  }
}
function getRequiredTag(outerTypeName, rawSchema) {
  if (outerTypeName === "ZodOptional") {
    return "[optional]";
  } else if (outerTypeName === "ZodDefault") {
    const defaultValue = rawSchema._def.defaultValue();
    return `[default: ${String(defaultValue)}]`;
  } else {
    return "[required]";
  }
}
function parseArgv(schema, argv) {
  const options = {};
  const numberKeys = [];
  const shapeEntries = Object.entries(schema.shape);
  for (const shapeEntry of shapeEntries) {
    const key = shapeEntry[0];
    const rawSchema = shapeEntry[1];
    const flagName = toKebabCase(key);
    const inner = unwrapField(rawSchema);
    const typeName = inner._def.typeName;
    if (typeName === "ZodString") {
      options[flagName] = { type: "string" };
    } else if (typeName === "ZodNumber") {
      options[flagName] = { type: "string" };
      numberKeys.push(key);
    } else if (typeName === "ZodBoolean") {
      options[flagName] = { type: "boolean" };
    } else if (typeName === "ZodEnum") {
      options[flagName] = { type: "string" };
    } else if (typeName === "ZodArray") {
      options[flagName] = { type: "string", multiple: true };
    } else {
      throw new Error(`parseArgv: unsupported Zod type for field "${key}" — use a different schema, or restructure`);
    }
  }
  const { values } = parseArgs({ args: argv, options, allowPositionals: false });
  const rebuilt = {};
  const valueEntries = Object.entries(values);
  for (const valueEntry of valueEntries) {
    const kebabKey = valueEntry[0];
    const val = valueEntry[1];
    rebuilt[toCamelCase(kebabKey)] = val;
  }
  for (const numKey of numberKeys) {
    const val = rebuilt[numKey];
    if (val !== undefined) {
      rebuilt[numKey] = Number.parseFloat(val);
    }
  }
  const parsed = schema.parse(rebuilt);
  return parsed;
}
function formatOpHelp(op) {
  const meta = op;
  const shapeEntries = Object.entries(meta.params.shape);
  const rows = shapeEntries.map((entry) => {
    const key = entry[0];
    const rawSchema = entry[1];
    const outerTypeName = rawSchema._def.typeName;
    const inner = unwrapField(rawSchema);
    const innerTypeName = inner._def.typeName;
    const flagStr = "--" + toKebabCase(key);
    const typeStr = getTypeLabel(innerTypeName, inner);
    const descStr = rawSchema.description ?? "(no description)";
    const reqStr = getRequiredTag(outerTypeName, rawSchema);
    return [flagStr, typeStr, descStr, reqStr];
  });
  const maxFlag = rows.reduce((acc, row) => Math.max(acc, row[0].length), 0);
  const maxType = rows.reduce((acc, row) => Math.max(acc, row[1].length), 0);
  const maxDesc = rows.reduce((acc, row) => Math.max(acc, row[2].length), 0);
  const optionLines = rows.map((row) => {
    const flag = row[0].padEnd(maxFlag);
    const typeStr = row[1].padEnd(maxType);
    const desc = row[2].padEnd(maxDesc);
    return `  ${flag}  ${typeStr}  ${desc}  ${row[3]}`;
  });
  const headerLines = [
    `archeglyph ${meta.name} — ${meta.description}`,
    "",
    `Usage: archeglyph ${meta.name} [options]`,
    "",
    "Options:"
  ];
  return headerLines.concat(optionLines).join(`
`);
}
function formatRootHelp(ops) {
  const metas = ops;
  const opNames = metas.map((op) => op.name);
  const allNames = opNames.concat(["help"]);
  const maxName = allNames.reduce((acc, name) => Math.max(acc, name.length), 0);
  const subLines = metas.map((op) => {
    return `  ${op.name.padEnd(maxName)}  ${op.description}`;
  });
  const fixedLines = [
    `  ${"help".padEnd(maxName)}  Show this help (or pass --help to any subcommand)`
  ];
  const headerLines = [
    "archeglyph — node-and-edge graph rendering tool",
    "",
    "Usage: archeglyph <subcommand> [options]",
    "",
    "Subcommands:"
  ];
  const footerLines = [
    "",
    "Run `archeglyph <subcommand> --help` for per-command details."
  ];
  return headerLines.concat(subLines).concat(fixedLines).concat(footerLines).join(`
`);
}
// packages/cli/src/main.ts
function formatZodError(err) {
  if (err instanceof ZodError) {
    return err.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join(`
`);
  }
  return err instanceof Error ? err.message : String(err);
}
function messageOf(value) {
  if (value === undefined)
    return;
  if (typeof value === "object" && value !== null && "message" in value) {
    return String(value.message);
  }
  return String(value);
}
function formatOpError(err) {
  if (typeof err === "object" && err !== null && "stage" in err) {
    const errObj = err;
    const stage = String(errObj.stage);
    const causeText = messageOf(errObj.cause) ?? (typeof errObj.detail === "string" ? errObj.detail : undefined);
    return causeText !== undefined ? `${stage}: ${causeText}` : stage;
  }
  return err instanceof Error ? err.message : String(err);
}
async function run(argv) {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") {
    process.stdout.write(formatRootHelp(REGISTRY));
    process.exit(0);
  }
  if (argv[0] === "--version" || argv[0] === "-V") {
    process.stdout.write(`0.0.0
`);
    process.exit(0);
  }
  const subcommand = argv[0];
  const rest = argv.slice(1);
  const op2 = REGISTRY.find((o) => o.name === subcommand);
  if (op2 === undefined) {
    process.stderr.write(`unknown subcommand: ${subcommand}

`);
    process.stderr.write(formatRootHelp(REGISTRY));
    process.exit(1);
  }
  if (rest.includes("--help") || rest.includes("-h")) {
    process.stdout.write(formatOpHelp(op2));
    process.exit(0);
  }
  let params;
  try {
    params = parseArgv(op2.params, rest);
  } catch (err) {
    process.stderr.write(`error parsing arguments for '${subcommand}':
`);
    process.stderr.write(formatZodError(err) + `

`);
    process.stderr.write(formatOpHelp(op2));
    process.exit(2);
  }
  const ctx = createOpContext();
  try {
    const code = await dispatchCli(op2, params, ctx);
    process.exit(code);
  } catch (err) {
    ctx.logger.error(formatOpError(err));
    process.exit(1);
  }
}

// packages/cli/bin/archeglyph.ts
await run(process.argv.slice(2));
