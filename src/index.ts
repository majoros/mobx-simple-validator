import yup, {ValidationError} from "yup";
import React from "react";
import {makeAutoObservable, makeObservable, observable} from "mobx";

export enum ValidateOn {
    Never = 0,
    Blur = 1 << 0,
    Change = 1 << 1,
    Submit = 1 << 2,
    Always = ~(~0 << 3)
}

export type ConditionalSchema<T> = T extends string
    ? yup.StringSchema
    : T extends number
        ? yup.NumberSchema
        : T extends boolean
            ? yup.BooleanSchema
            : T extends Record<any, any>
                ? yup.AnyObjectSchema
                : T extends Array<any>
                    ? yup.ArraySchema<any, any>
                    : yup.AnySchema;

export type Shape<F> = {
    [K in keyof F]: ConditionalSchema<F[K]>;
};

export class FormValidator<T> {

    _keys: string[] = [];
    errors = new Map<string, string>()
    private _yupSchema: yup.ObjectSchema<any>;

    _defaults: T;
    values: T;
    _submitCallback: (values: T) => void;
    _validateFlags: ValidateOn;


    constructor(
        defaults: T,
        submitCallback: (values: T) => void,
        yupSchema: yup.ObjectSchema<any>,
        validateOn: ValidateOn) {
        makeAutoObservable(this)

        this.handleBlur = this.handleBlur.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this._hasErrors = this._hasErrors.bind(this);

        this._validateFlags = validateOn;

        this._yupSchema = yupSchema;
        this._defaults = {...defaults};
        this.values = {...defaults};
        this._submitCallback = submitCallback;

        // @ts-ignore: FIXME
        this._keys = Object.keys(defaults) as Array<typeof T>;
        this._keys.forEach((key) => {
            this.errors.set(key, "");
        })
    }

    reset() {
        this.values = {...this._defaults};
        for (let key of this.keys) {
            this.errors.set(key, "");
        }
    }

    get keys() {
        let keys: string[] = [];
        for (let key in this._keys) {
            keys.push(this._keys[key]);
        }
        return keys;
    }

    _hasErrors(): boolean {
        for (let [key, value] of this.errors) {
            if (value !== "")
                return true;
        }
        return false;
    }

    async handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        if ((this._validateFlags & ValidateOn.Submit) === ValidateOn.Submit) {
            await this._validateAll()
        }
        if (!this._hasErrors()) {
            this._submitCallback(this.values)
        }
    }

    async handleBlur(e: React.FocusEvent<any>) {
        let key = e.currentTarget.name;
        let val = e.currentTarget.value;
        if ((this._validateFlags & ValidateOn.Blur) === ValidateOn.Blur) {
            await this._validateAt(key, val)
        }
    }

    async handleChange(e: React.FormEvent<HTMLFormElement>) {
        let key = e.currentTarget.name;
        let val = e.currentTarget.value;
        this.values[key as keyof T] = val;
        if ((this._validateFlags & ValidateOn.Change) === ValidateOn.Change) {
            await this._validateAt(key, val)
        }
    }

    async _validateAt(key: string, value: any): Promise<void> {
        try {
            const obj = {
                [key]: value,
            }
            await this._yupSchema.validateAt(key, obj)
            this.errors.set(key, "")
        } catch (err: any) {
            this.errors.set(key, err.errors[0])
        }
    }

    async _validateAll() {
        for (const key of this.keys) {
            await this._validateAt(key, this.values[key as keyof T])
        }
    }
}