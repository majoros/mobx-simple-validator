import yup from "yup";
import React from "react";
import {makeAutoObservable, makeObservable, observable} from "mobx";

export enum ValidateOnFlags {
    Never = 0,
    Blur = 1 << 0,
    Change = 1 << 1,
    Submit = 1 << 2,
    Always = ~(-1 << 3)
}

export class FormValidator<T extends Object> {

    private _keys: Array<keyof T> = [];
    private _yupSchema: yup.ObjectSchema<any>;
    private _defaults: T;
    private _submitCallback: (values: T) => void;
    private _validateFlags: ValidateOnFlags;

    errors = new Map<keyof T, string>()
    values: T;

    constructor(
        defaults: T,
        submitCallback: (values: T) => void,
        yupSchema: yup.ObjectSchema<any>,
        validateOn: ValidateOnFlags = ValidateOnFlags.Blur | ValidateOnFlags.Submit) {


        this.onBlur = this.onBlur.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.hasErrors = this.hasErrors.bind(this);
        this.hasError = this.hasError.bind(this);
        this.getError = this.getError.bind(this);

        this._validateFlags = validateOn;

        this.values = {...defaults};
        this._defaults = {...defaults};
        this._yupSchema = yupSchema;
        this._submitCallback = submitCallback;

        this._keys = Object.keys(defaults) as Array<keyof T>;
        for(let key of this._keys){
            this.errors.set(key, "");
        }
        makeAutoObservable(this)
    }

    setError(field: keyof T, value: string){
        this.errors.set(field, value);
    }

    getError(field: keyof T): string{
        return this.errors.get(field) || "";
    }

    hasError(field: keyof T): boolean{
        return this.errors.get(field) !== "";
    }

    getValue(field: keyof T ){
        return this.values[field];
    }

    setValue<K extends keyof T>(field: K, value: T[K] ){
        this.values[field] = value;
    }

    reset() {
        for(let key of this._keys){
            this.setValue(key, this._defaults[key]);
            this.errors.set(key, "");
        }
    }

    get keys() {
        return [...this._keys];
    }

    hasErrors(): boolean {
        for (let [key, value] of this.errors) {
            if (value !== "")
                return true;
        }
        return false;
    }

    async onSubmit(e: React.FormEvent<HTMLFormElement>) {
        if ((this._validateFlags & ValidateOnFlags.Submit) === ValidateOnFlags.Submit) {
            await this.validateAll()
        }

        if (!this.hasErrors()) {
            this._submitCallback({...this.values})
        }
    }

    async onBlur<K extends keyof T>(e: React.FocusEvent<HTMLInputElement>) {
        let key = e.currentTarget.name as K;
        let val = e.currentTarget.value as T[K];
        if ((this._validateFlags & ValidateOnFlags.Blur) === ValidateOnFlags.Blur) {
            await this.validateAt(key, val)
        }
    }

    async onChange<K extends keyof T>(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        let key = e.currentTarget.name as K;
        let val = e.currentTarget.value as T[K];
        this.setValue(key, val);
        if ((this._validateFlags & ValidateOnFlags.Change) === ValidateOnFlags.Change) {
            await this.validateAt(key, val)
        }
    }

    async validateAt<K extends keyof T>(key: K, value: T[K]): Promise<void> {
        try {
            const obj = {
                [key]: value,
            }
            await this._yupSchema.validateAt(key as string, obj)
            this.setError(key, "")
        } catch (err: any) {
            this.setError(key, err.errors[0])
        }
    }

    async validateAll() {
        for (const key of this._keys) {
            await this.validateAt(key as keyof T, this.getValue(key))
        }
    }
}