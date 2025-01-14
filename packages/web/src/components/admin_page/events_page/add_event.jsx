import React from 'react';

import Validate from '../../../Global';
import InvalidClient from '../invalid_client';
import { url } from '../../../Global';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

const AddEvent = () => {
    const history = useNavigate();

    const [formState, setFormState] = useState({
        title: '',
        startdate: '',
        enddate: '',
        description: '',
        location: '',
        locationlink: '',
        banner: '',
        facebooklink: ''
    });

    const handleInputChange = (e) => {
        const target = e.target;
        let value = target.value;
        const name = target.name;

        if (name === 'startdate' || name === 'enddate') {
            let date = new Date(value);
            date = date.toISOString();
            value = date;
            if (name === 'startdate' && formState.enddate != '') {
                if (new Date(formState.enddate) < new Date(value)) {
                    alert('End date is earlier than start date');
                    target.value = '';
                    return;
                } else if (formState.startdate == value) {
                    alert('The start and end date are the same');
                    target.value = '';
                    return;
                }
            } else if (name === 'enddate' && formState.startdate != '') {
                if (new Date(formState.startdate) > new Date(value)) {
                    alert('End date is earlier than start date');
                    target.value = '';
                    return;
                } else if (formState.startdate == value) {
                    alert('The start and end date are the same');
                    target.value = '';
                    return;
                }
            }
        }
        setFormState({
            ...formState,
            [name]: value
        });
    };

    // if page does not redirect, this means bad request

    const addNewEvent = () => {
        axios({
            method: 'post',
            url: url + '/api/event/',
            headers: { 'BEARER-TOKEN': localStorage.getItem('auth_token') },
            data: { ...formState }
        })
            // eslint-disable-next-line no-unused-vars
            .then((res) => {
                console.log('New job was added');
                history(-1);
            })
            .catch((err) => {
                alert(err['response']['data']['data']['data']);
            });
    };

    if (Validate()) {
        return (
            <div className="add-member-main-div">
                <Form>
                    <Form.Group className="mb-3" controlId="formBasicText">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="title"
                            name="title"
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicText">
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                            type="datetime-local"
                            placeholder="startdate"
                            name="startdate"
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicText">
                        <Form.Label>End Date</Form.Label>
                        <Form.Control
                            type="datetime-local"
                            placeholder="enddate"
                            name="enddate"
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicText">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="description"
                            name="description"
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicText">
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="location"
                            name="location"
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicText">
                        <Form.Label>Location Link</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="locationlink"
                            name="locationlink"
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicText">
                        <Form.Label>Banner</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="banner"
                            name="banner"
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicText">
                        <Form.Label>Facebook Link</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="facebooklink"
                            name="facebooklink"
                            onChange={handleInputChange}
                        />
                    </Form.Group>

                    <Button
                        variant="primary"
                        type="button"
                        onClick={() => {
                            addNewEvent();
                        }}
                    >
                        Add new Event
                    </Button>
                </Form>
            </div>
        );
    } else {
        return <InvalidClient />;
    }
};

export default AddEvent;
