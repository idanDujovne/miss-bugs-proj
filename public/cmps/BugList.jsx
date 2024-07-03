const { Link } = ReactRouterDOM

import { userService } from '../services/user.service.js'
import { BugPreview } from './BugPreview.jsx'

export function BugList({ bugs, onRemoveBug, onEditBug }) {

    const user = userService.getLoggedinUser()

    function isOwner(bug) {
        if (!user) return false
        if (!bug.creator) return false
        return user.isAdmin || bug.creator._id === user._id
    }

    return (
        <ul className="bug-list container">
            {bugs.map((bug) => (
                <li className="bug-preview" key={bug._id}>
                    <BugPreview bug={bug} />
                    {/* <section> */}
                        <button><Link to={`/bug/${bug._id}`}>Details</Link></button>
                        {
                            isOwner(bug) &&
                            <div>
                                <button onClick={() => onRemoveBug(bug._id)}>x</button>
                                <button onClick={() => onEditBug(bug)}>Edit</button>
                            </div>
                        }
                    {/* </section> */}
                </li>
            ))}
        </ul>
    )
}
