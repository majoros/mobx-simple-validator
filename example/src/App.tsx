import React, {useContext, useEffect, useMemo, useState} from 'react';
import './App.css';
import {Button, Checkbox, FormControlLabel, Grid, Paper, TextField} from "@mui/material";
import * as Yup from 'yup';
import {FormValidator, ValidateOnFlags} from "mobx-simple-validator";
import {observer} from "mobx-react";

export interface User extends Object {
  name: string
  address: string
  isAwesome: boolean
  email: string
  weight: number|null
}

const exampleFormSchema = Yup.object().shape({
    name: Yup.string().required("A name is required."),
    address: Yup.string().required(),
    isAwesome: Yup.boolean().required("Are you awesome or not?"),
    email: Yup.string().email().required("You must provide a valid email."),
    weight: Yup.number()
        .min(1, "Must be above 1.")
        .max(600, "Must be below 600.")
        .optional().nullable(),
});

const App: React.FC = () => {

    const defaults: User = {
        name: "",
        address: "",
        email: "",
        isAwesome: true,
        weight: 280,
    }

    function submitted(user: User){
      console.log("SUBMITTED")
      console.log(user)
    }

    const validator = useMemo(() => {
        return new FormValidator<User>(
            defaults,
            submitted,
            exampleFormSchema,
            (ValidateOnFlags.Blur | ValidateOnFlags.Submit)
        );
    }, [])

    return (
        <Grid
            paddingTop={5}
            container
            direction="column"
            alignItems="center"
        >
            <Paper elevation={3} sx={{maxWidth: 400, padding: 2}}>
                    <Grid container item direction={"column"}>
                        <Grid item padding={1}>
                            <TextField
                                fullWidth
                                error={validator.hasError("name")}
                                helperText={validator.getError("name")}
                                value={validator.getValue("name")}
                                onChange={async (e) => { await validator.onChange(e); }}
                                onBlur={async (e: any) => { await validator.onBlur(e); }}
                                name={"name"}
                                label="Name"
                            />
                        </Grid>
                        <Grid item padding={1}>
                            <TextField
                                fullWidth
                                error={validator.hasError("address")}
                                helperText={validator.getError("address")}
                                value={validator.getValue("address")}
                                onChange={async (e) => { await validator.onChange(e); }}
                                onBlur={async (e: any) => { await validator.onBlur(e); }}
                                name={"address"}
                                label="Address"
                            />
                        </Grid>
                        <Grid item padding={1}>
                            <TextField
                                fullWidth
                                error={validator.hasError("email")}
                                helperText={validator.getError("email")}
                                value={validator.getValue("email")}
                                onChange={async (e) => { await validator.onChange(e); }}
                                onBlur={async (e: any) => { await validator.onBlur(e); }}
                                name={"email"}
                                label="Email"
                            />
                        </Grid>
                        <Grid container item>
                            <Grid item padding={1} sm={6}>
                                <FormControlLabel
                                    sx={{marginTop: 1}}
                                    control={
                                        <Checkbox
                                            defaultChecked
                                            value={validator.getValue("isAwesome")}
                                            onChange={async (e) => { await validator.onChange(e); }}
                                            onBlur={async (e: any) => { await validator.onBlur(e); }}
                                        />
                                    }
                                    label="Is Awesome"/>
                            </Grid>
                            <Grid item padding={1} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Weight"
                                    type={"number"}
                                    name={"weight"}
                                    error={validator.hasError("weight")}
                                    helperText={validator.getError("weight")}
                                    value={validator.getValue("weight")}
                                    onChange={async (e) => { await validator.onChange(e); }}
                                    onBlur={async (e: any) => { await validator.onBlur(e); }}
                                />
                            </Grid>
                        </Grid>
                        <Grid container item justifyContent={"flex-end"}>
                            <Grid
                                container
                                item
                                direction={"row"}
                                padding={1}
                                sm={3}
                            >
                                <Button
                                    fullWidth
                                    variant={"contained"}
                                    onClick={(e: any) => {validator.reset()}}
                                >
                                    Reset
                                </Button>
                            </Grid>
                            <Grid
                                container
                                item
                                direction={"row"}
                                padding={1} sm={3}
                            >
                                <Button
                                    fullWidth
                                    variant={"contained"}
                                    color={"success"}
                                    onClick={async (e: any) => {await validator.onSubmit(e)}}
                                >
                                    Submit
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
            </Paper>
        </Grid>
    );
}

export default observer(App);