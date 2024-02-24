import React from 'react'
import * as Yup from 'yup';
import {FormValidator, ValidateOnFlags} from "../src/"

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
    console.log("I RAN!")
}

test("Validation On Blur.", async () => {
    let validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema,
        (ValidateOnFlags.Submit|ValidateOnFlags.Blur));

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
    expect(validator.hasErrors()).toEqual(false)
    await validator.handleBlur(eventBlur);
    expect(validator.hasErrors()).toEqual(true)
    validator.reset();
});

//Make sure that each flag only calls the validate when its should.
test.each([
    [ValidateOnFlags.Change, 1, 1, 0],
    [ValidateOnFlags.Blur,   0, 1, 0],
    [ValidateOnFlags.Submit, 0, 0, 1],
    [ValidateOnFlags.Always, 1, 2, 1],
    ])("Validation Flags.", async (flags: ValidateOnFlags, cCount: number, bCount: number, sCount: number) => {

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

    const spyAt = jest.spyOn(validator, "validateAt");
    const spyAll = jest.spyOn(validator, "validateAll");

    const eventBlur = eventChange as React.FocusEvent<HTMLInputElement>;

    await validator.handleChange(eventChange);
    expect(spyAt).toHaveBeenCalledTimes(cCount);

    await validator.handleBlur(eventBlur);
    expect(spyAt).toHaveBeenCalledTimes(bCount);

    await validator.handleSubmit(event);
    expect(spyAll).toHaveBeenCalledTimes(sCount);

});

test("Set and Reset Good values", async () => {
    const validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema,
        (ValidateOnFlags.Submit|ValidateOnFlags.Blur));

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

    expect(validator.getValue("address")).toEqual("")
    await validator.handleChange(eventChange);
    expect(validator.getValue("address")).toEqual(adrs)
    validator.reset();
    expect(validator.getValue("address")).toEqual("")
});

test("Handle submit without errors", async () => {
    const validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema,
        (ValidateOnFlags.Submit|ValidateOnFlags.Blur));
    validator._submitCallback = jest.fn()

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

    //const spy = jest.spyOn(obj, "mySubmitCallback");
    //const spy = jest.spyOn(validator, "_submitCallback");
    console.log("??????????????????????????")
    await validator.handleSubmit(event);
    console.log("??????????????????????????")
    expect(validator._submitCallback).toHaveBeenCalledTimes(1);
});

test("Handle submit with errors", async () => {
    const mockCallback = jest.fn();
    const validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema,
        (ValidateOnFlags.Submit|ValidateOnFlags.Blur));

    let event = {} as React.FormEvent<HTMLFormElement>;

    const obj = {mySubmitCallback};
    const spy = jest.spyOn(obj, "mySubmitCallback");
    await validator.handleSubmit(event);
    expect(spy).toHaveBeenCalledTimes(0);

    // FIXME
    //const spy = jest.spyOn(validator, "_submitCallback");
    //await validator.handleSubmit(event);
    //expect(spy).toHaveBeenCalledTimes(0);
});

test("Check keys.", async () => {
    const validator = new FormValidator<IUser>(
        userDefaults,
        mySubmitCallback,
        schema);

    expect(validator.keys).toEqual(Object.keys(userDefaults));
});
