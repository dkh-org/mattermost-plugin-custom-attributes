import React from 'react';
import PropTypes from 'prop-types';

import UsersInput from '../users_input';

const {formatText, messageHtmlToComponent} = window.PostUtils;

export default class CustomAttribute extends React.Component {
    static propTypes = {
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        users: PropTypes.array,
        groups: PropTypes.array,
        hideDelete: PropTypes.bool,
        markdownPreview: PropTypes.bool,
        onDelete: PropTypes.func,
        onChange: PropTypes.func.isRequired,
        actions: PropTypes.shape({
            getProfilesByIds: PropTypes.func.isRequired,
        }).isRequired,
    }

    constructor(props) {
        super(props);

        this.state = {
            name: this.props.name,
            groups: this.props.groups,
            error: null,
        };

        this.initUsers();
    }

    // initUsers fetches user profiles for the users ids passed in props
    async initUsers() {
        if (!this.props.users || !this.props.users.length) {
            return;
        }

        const profiles = await this.props.actions.getProfilesByIds(this.props.users);

        let users = profiles.data;

        if (users.length !== this.props.users.length) {
            // Check if all ids were returned.
            // mattermost-redux removes the current admin user from the result at:
            // https://github.com/mattermost/mattermost-redux/blob/5f5a8a5007661f6d54533c2b51299748338b5a65/src/actions/users.ts#L340
            const unknownIds = this.props.users.filter((userId) =>
                !users.find((user) => user.id === userId)
            );

            // Add the unknown ids directly to display on the input
            users = users.concat(unknownIds);
        }

        this.setState({users});
    }

    handleNameInput = (e) => {
        if (!e.target.value || e.target.value.trim() === '') {
            this.setState({error: 'Attribute name cannot be empty.'});
        } else if (this.state.users || this.state.groups) {
            this.setState({error: null});
        }

        this.setState({name: e.target.value});
        this.props.onChange({id: this.props.id, name: e.target.value, users: this.state.users, groups: this.state.groups});
    }

    handleUsersInput = (userIds) => {
        const usersEmpty = !userIds || !userIds.length;
        const groupsEmpty = !this.state.groups || this.state.groups.trim() === '';

        if (usersEmpty && groupsEmpty) {
            this.setState({error: 'Attribute must include at least one user or group.'});
        } else if (this.state.name) {
            this.setState({error: null});
        }

        this.setState({users: userIds});
        this.props.onChange({id: this.props.id, name: this.state.name, users: userIds, groups: this.state.groups});
    }

    handleGroupsInput = (e) => {
        const usersEmpty = !e.target.value || e.target.value.trim() === '';
        const groupsEmpty = !this.state.groups || this.state.groups.trim() === '';

        if (usersEmpty && groupsEmpty) {
            this.setState({error: 'Attribute must include at least one user or group.'});
        } else if (this.state.name) {
            this.setState({error: null});
        }

        this.setState({groups: e.target.value});
        this.props.onChange({id: this.props.id, name: this.state.name, users: this.state.users, groups: e.target.value});
    }

    handleDelete = () => {
        this.props.onDelete(this.props.id);
    }

    getMarkdownPreview = () => {
        if (!this.props.markdownPreview) {
            return null;
        }

        const formattedText = formatText(this.state.name);
        return messageHtmlToComponent(formattedText);
    }

    render() {
        let deleteButton = null;
        if (!this.props.hideDelete) {
            deleteButton = (
                <div
                    className='col-xs-12 col-sm-1'
                >
                    <a
                        style={styles.deleteIcon}
                        onClick={this.handleDelete}
                    >
                        {'\u2296'}
                    </a>
                </div>
            );
        }

        let errorLabel = null;
        if (this.state.error) {
            errorLabel = this.state.error;
        }

        return (
            <div
                style={styles.attributeRow}
            >
                <strong>{this.getMarkdownPreview()}</strong>
                <div
                    className='row'
                >
                    <div
                        className='col-xs-12 col-sm-2'
                    >
                        <input
                            id={`name-${this.props.id}`}
                            className='form-control'
                            type='text'
                            placeholder='Attribute Label'
                            value={this.state.name}
                            onChange={this.handleNameInput}
                        />
                    </div>
                    <div className='col-xs-12 col-sm-5'>
                        <UsersInput
                            placeholder='@username1 @username2'
                            users={this.state.users}
                            onChange={this.handleUsersInput}
                        />
                    </div>
                    <div className='col-xs-12 col-sm-4'>
                        <input
                            id={`groups-${this.props.id}`}
                            className='form-control'
                            type='text'
                            placeholder='GroupID1 GroupID2'
                            value={this.state.groups}
                            onChange={this.handleGroupsInput}
                        />
                    </div>
                    {deleteButton}
                </div>
                <div style={styles.errorLabel}>
                    {errorLabel}
                </div>
            </div>);
    }
}

const styles = {
    attributeRow: {
        margin: '12px 0',
        borderBottom: '1px solid #ccc',
        padding: '4px 0 12px',
    },
    deleteIcon: {
        textDecoration: 'none',
        height: '20px',
        width: '24px',
        color: '#DB1C34',
        fontFamily: 'material',
        fontSize: '32px',
        lineHeight: '32px',
        margin: '0 0 0 -12px',
    },
    errorLabel: {
        margin: '8px 0 0',
        color: '#EB5757',
    },
};