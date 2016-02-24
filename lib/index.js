'use strict';

const validate = (validator, data) => {
    if (validator) {
        let valid = validator(data);
        if (!valid) {
            throw {
                code: 400,
                errors: validator.errors
            };
        }
    }
};

module.exports = (options) => {
    let inputValidate = options.data;
    return (ctx, next) => {
        let error = validate(inputValidate, ctx.data);
        if (error) {throw error}
        ctx.emitter.on('before-result', () => {
            let status = ctx.result.status;
            let resultValidate = options[status];
            let error = validate(resultValidate, ctx.result.data);
            if (error) {
                return Promise.reject(error);
            }
        });
        return next();
    };
};
