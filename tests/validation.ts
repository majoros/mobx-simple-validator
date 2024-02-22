import React from 'react'
import * as Yup from 'yup';
import {FormValidator, ValidateOn} from "../src/"

interface IUser {
    name: string,
    address: string,
    isAwesome: boolean,
    email: string,
    weight: number|null,
}
const userDefaults : IUser = {
    name: "",
    address: "",
    isAwesome: false,
    email: "",
    weight: null
}
const schema = Yup.object().shape({
    name: Yup.string().required("A hostname is required."),
    address: Yup.string().required(),
    isAwesome: Yup.boolean().required("The content field is required."),
    email: Yup.string().required("You must provide a valid email."),
    weight: Yup.number()
        .min(1, "The weight but be between 1 and 600")
        .max(600, "The weight but be between 40 and 600")
        .optional().nullable(),
});

const mySubmitCallback = (values: IUser) => {
}

test("Validation On Blur.", async () => {
    let validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema,
        (ValidateOn.Submit|ValidateOn.Blur));

    // @ts-ignore
    const eventChange = {
        target: {},
        currentTarget: {
            name: "address",
            value: null,
        }
    } as React.ChangeEvent<HTMLInputElement>;

    const eventBlur = eventChange as React.FocusEvent<HTMLInputElement>;

    await validator.handleChange(eventChange);
    expect(validator._hasErrors()).toEqual(false)
    await validator.handleBlur(eventBlur);
    expect(validator._hasErrors()).toEqual(true)
    validator.reset();
});

//Make sure that each flag only calls the validate when its should.
test.each([
    [ValidateOn.Change, 1, 1, 0],
    [ValidateOn.Blur,   0, 1, 0],
    [ValidateOn.Submit, 0, 0, 1],
    [ValidateOn.Always, 1, 2, 1],
    ])("Validation Flags.", async (flags: ValidateOn, cCount: number, bCount: number, sCount: number) => {

    let validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema,
        flags);

    let event = {} as  React.FormEvent<HTMLFormElement>;

    // @ts-ignore
    const eventChange = {
        target: {},
        currentTarget: { name: "address", value: "myAddress" }
    } as React.ChangeEvent<HTMLInputElement>;

    validator._validateAt = jest.fn();
    validator._validateAll = jest.fn();
    const eventBlur = eventChange as React.FocusEvent<HTMLInputElement>;

    await validator.handleChange(eventChange);
    expect(validator._validateAt).toHaveBeenCalledTimes(cCount);

    await validator.handleBlur(eventBlur);
    expect(validator._validateAt).toHaveBeenCalledTimes(bCount);

    await validator.handleSubmit(event);
    expect(validator._validateAll).toHaveBeenCalledTimes(sCount);

});

test("Set and Reset Good values", async () => {
    const validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema,
        (ValidateOn.Submit|ValidateOn.Blur));

    const adrs = "This is my valid address";

    // @ts-ignore
    const eventChange = {
        target: {},
        currentTarget: {
            name: "address",
            value: adrs,
        }
    } as React.ChangeEvent<HTMLInputElement>;

    const eventBlur = eventChange as React.FocusEvent<HTMLInputElement>;

    expect(validator.values.address).toEqual("")
    await validator.handleChange(eventChange);
    expect(validator.values.address).toEqual(adrs)
    validator.reset();
    expect(validator.values.address).toEqual("")
});

test("Handle submit without errors", async () => {
    const mockCallback = jest.fn();
    const validator = new FormValidator<IUser>(
        userDefaults,
        mockCallback,
        schema,
        (ValidateOn.Submit|ValidateOn.Blur));

    let event = {} as  React.FormEvent<HTMLFormElement>;

    const eventChange = {
        target: {},
        currentTarget: {}
    }

    eventChange.currentTarget = {name: "name", value: "myName"};
    await validator.handleChange(eventChange as React.ChangeEvent<HTMLInputElement>)
    eventChange.currentTarget = {name: "address", value: "myAddress"};
    await validator.handleChange(eventChange as React.ChangeEvent<HTMLInputElement>)
    eventChange.currentTarget = {name: "email", value: "chris@some_email.com"};
    await validator.handleChange(eventChange as React.ChangeEvent<HTMLInputElement>)
    eventChange.currentTarget = {name: "isAwesome", value: true};
    await validator.handleChange(eventChange as React.ChangeEvent<HTMLInputElement>)

    await validator.handleSubmit(event);
    expect(validator._submitCallback).toHaveBeenCalled();
});

test("Handle submit with errors", async () => {
    const mockCallback = jest.fn();
    const validator = new FormValidator<IUser>(
        userDefaults,
        mockCallback,
        schema,
        (ValidateOn.Submit|ValidateOn.Blur));

    let event = {} as React.FormEvent<HTMLFormElement>;
    await validator.handleSubmit(event);
    expect(validator._submitCallback).not.toHaveBeenCalledTimes(1);
});

test("Check keys.", async () => {
    const validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema,
        (ValidateOn.Submit|ValidateOn.Blur));

    expect(validator.keys).toEqual(Object.keys(userDefaults));
});
