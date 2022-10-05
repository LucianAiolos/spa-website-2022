import { useLocation, useNavigate } from 'react-router-dom'
import { React, useState } from 'react'
import axios from 'axios'
import { Card, Form, Button } from 'react-bootstrap'
import InvalidClient from '../../invalid_client'
import Validate, { url } from '../../../../Global'

const MentorsActions = () => {
    const location = useLocation()
    const history = useNavigate()
    const mentor_data = location.state.mentor_data

    const [formState, setFormState] = useState({
        profilepicture: '',
        firstname: '',
        lastname: '',
        company: '',
        position: '',
        sociallink: '',
    })

    const handleInputChange = (e) => {
        const target = e.target
        const value = target.value
        const name = target.name

        setFormState({
            ...formState,
            [name]: value,
        })
    }

    const remove_job = () => {
        axios({
            method: 'delete',
            url: url + '/api/mentors/' + mentor_data['id'] + '/',
            headers: { BEARER_TOKEN: localStorage.getItem('auth_token') },
        })
            // eslint-disable-next-line no-unused-vars
            .then((res) => {
                console.log('Mentor has been deleted')
                history(-1)
            })
            .catch((err) => {
                alert(err['request']['response']['data'])
            })
    }

    const edit_mentor = () => {
        axios({
            method: 'put',
            url: url + '/api/mentors/' + mentor_data['id'],
            headers: { BEARER_TOKEN: localStorage.getItem('auth_token') },
            data: { ...formState },
        })
            // eslint-disable-next-line no-unused-vars
            .then((res) => {
                console.log('Mentor info has been edited')
                history(-1)
            })
            .catch((err) => {
                alert(err['response']['data']['data']['data'])
            })
    }

    if (Validate()) {
        return (
            <div className="actions-single-member">
                <div className="single-member-box">
                    <Card style={{ width: '18rem' }} className="member-card">
                        <Card.Img
                            variant="top"
                            src={mentor_data['profilepicture']}
                        />
                        <Card.Body>
                            <Card.Title>
                                {mentor_data['firstname'] +
                                    ' ' +
                                    mentor_data['lastname']}
                            </Card.Title>
                            <Card.Text>{mentor_data['position']}</Card.Text>
                            <Card.Text>{mentor_data['company']}</Card.Text>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    window.open(mentor_data['sociallink'])
                                }}
                                className="linkedin-button"
                            >
                                LinkedIn
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    remove_job()
                                }}
                            >
                                Remove
                            </Button>
                        </Card.Body>
                    </Card>
                </div>

                <div className="member-form-edit">
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="first name"
                                name="firstname"
                                onChange={handleInputChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="last name"
                                name="lastname"
                                onChange={handleInputChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>Company</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="company"
                                name="company"
                                onChange={handleInputChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>Position</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="position"
                                name="positon"
                                onChange={handleInputChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>Logo</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="gdrive picture"
                                name="profilepicture"
                                onChange={handleInputChange}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formBasicText">
                            <Form.Label>Social Link</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="social link"
                                name="sociallink"
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Button
                            variant="primary"
                            type="button"
                            onClick={() => {
                                edit_mentor()
                            }}
                        >
                            Edit Mentor
                        </Button>
                    </Form>
                </div>
            </div>
        )
    } else {
        return <InvalidClient />
    }
}

export default MentorsActions
