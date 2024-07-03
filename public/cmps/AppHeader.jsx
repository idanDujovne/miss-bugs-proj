const { useEffect, useState } = React

const { NavLink, Link } = ReactRouterDOM
const { useNavigate } = ReactRouter

import { userService } from '../services/user.service.js'
import { showErrorMsg } from '../services/event-bus.service.js'

import { LoginSignup } from './LoginSignup.jsx'
import { UserMsg } from './UserMsg.jsx'

export function AppHeader() {
  const navigate = useNavigate()
  const [user, setUser] = useState(userService.getLoggedinUser())

  function onLogout() {
    userService.logout()
      .then(() => onSetUser(null))
      .catch(err => showErrorMsg('Oops try again'))
  }

  function onSetUser(user) {
    setUser(user)
    navigate('/')
  }

  useEffect(() => {
    // component did mount when dependancy array is empty
  }, [])

  return (
    <header>
      <UserMsg />
      <section>

        <nav>
          <NavLink to="/">Home</NavLink> |<NavLink to="/bug">Bugs</NavLink> |
          <NavLink to="/about">About</NavLink>
        </nav>
        <h1>Bugs are Forever</h1>

      </section >
      {user ? (
        <section>

          <Link to={`/user/${user.id}`}>Hello {user.fullName}</Link>
          <button onClick={onLogout}>Logout</button>

        </section>
      ) : (
        <section>
          <LoginSignup onSetUser={onSetUser} />
        </section>
      )}
    </header>
  )
}
