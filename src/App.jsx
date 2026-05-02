import { useState, useEffect, useRef } from 'react'
import { useAuth }     from './hooks/useAuth'
import { useEntries }  from './hooks/useEntries'
import { useProfile }  from './hooks/useProfile'
import { useFavorites } from './hooks/useFavorites'

import Navbar            from './components/layout/Navbar'
import LoadingSpinner    from './components/ui/LoadingSpinner'
import AuthPage          from './pages/AuthPage'
import HomePage          from './pages/HomePage'
import SearchPage        from './pages/SearchPage'
import MyListPage        from './pages/MyListPage'
import ProfilePage       from './pages/ProfilePage'
import PeoplePage        from './pages/PeoplePage'
import PublicProfilePage from './pages/PublicProfilePage'
import AboutPage         from './pages/AboutPage'
import PersonPage        from './pages/PersonPage'

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { entries, loading: entriesLoading, upsertEntry, removeEntry } = useEntries(user?.id)
  const { profile, loading: profileLoading, updateProfile } = useProfile(user?.id)
  const { favorites, toggleFavorite, isFavorite, reorderFavorites } = useFavorites(user?.id)

  const [page,          setPage]          = useState('home')
  const [viewingUser,   setViewingUser]   = useState(null)
  const [viewingPerson, setViewingPerson] = useState(null)
  const [prevPage,      setPrevPage]      = useState('people')

  const pageRef = useRef(page)
  pageRef.current = page

  useEffect(() => {
    window._watchvault_open_person = (personId) => {
      setViewingPerson(personId)
      setPrevPage(pageRef.current)
      setPage('person')
    }
    window._watchvault_open_item = () => {}
    window._watchvault_goto_profile = () => setPage('profile')

    return () => {
      delete window._watchvault_open_person
      delete window._watchvault_open_item
      delete window._watchvault_goto_profile
    }
  }, [])

  if (authLoading) return <LoadingSpinner message="Loading WatchVault…" />
  if (!user)       return <AuthPage />
  if (entriesLoading || profileLoading) return <LoadingSpinner message="Loading your vault…" />

  async function handleSignOut() { await signOut(); setPage('home') }

  function handleViewProfile(targetUser, from = 'people') {
  setViewingUser(targetUser)
  setPrevPage(from)
  setPage('public-profile')
}

  const favProps = { favorites, toggleFavorite, isFavorite, reorderFavorites }

  return (
    <>
      <Navbar
        user={user}
        profile={profile}
        page={page}
        onNav={p => { setPage(p); setViewingUser(null) }}
        onLogout={handleSignOut}
      />

      {page === 'home' && (
  <HomePage
    onNav={setPage}
    userId={user.id}
    entries={entries}
    upsertEntry={upsertEntry}
    removeEntry={removeEntry}
    isFavorite={isFavorite}
    toggleFavorite={toggleFavorite}
  />
)}
      {page === 'search' && (
        <SearchPage userId={user.id} entries={entries} upsertEntry={upsertEntry} removeEntry={removeEntry} {...favProps} />
      )}

      {page === 'mylist' && (
        <MyListPage userId={user.id} entries={entries} upsertEntry={upsertEntry} removeEntry={removeEntry} {...favProps} />
      )}

      {page === 'people' && (
  <PeoplePage currentUserId={user.id} onViewProfile={u => handleViewProfile(u, 'people')} />
)}

      {page === 'profile' && (
        <ProfilePage
          profile={profile} entries={entries} userId={user.id}
          updateProfile={updateProfile} upsertEntry={upsertEntry} removeEntry={removeEntry}
          onViewProfile={u => handleViewProfile(u, 'profile')}
          {...favProps}
        />
      )}

      {page === 'person' && viewingPerson && (
        <PersonPage
          personId={viewingPerson}
          onBack={() => { setPage(prevPage); setViewingPerson(null) }}
          userId={user.id} entries={entries} upsertEntry={upsertEntry} removeEntry={removeEntry}
          isFavorite={isFavorite} toggleFavorite={toggleFavorite}
        />
      )}

      {page === 'public-profile' && viewingUser && (
        <PublicProfilePage
          targetUser={viewingUser} currentUserId={user.id}
          onBack={() => setPage(prevPage)}
          onViewProfile={u => handleViewProfile(u, 'public-profile')}
          currentUserFavProps={favProps}
        />
      )}

      {page === 'about' && <AboutPage />}
      
      {page === 'public-profile' && viewingUser && (
  <PublicProfilePage
    
    isFavorite={isFavorite}
    toggleFavorite={toggleFavorite}
  />
)}
    </>
  )
}
