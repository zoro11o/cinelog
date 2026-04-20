// ─── ProfilePage — own profile ─────────────────────────────
import ProfileContent from '../components/ProfileContent'

export default function ProfilePage({ profile, entries, userId, updateProfile, onViewProfile, upsertEntry, removeEntry, favorites, toggleFavorite, isFavorite, reorderFavorites }) {
  return (
    <ProfileContent
      profile={profile}
      entries={entries}
      profileUserId={userId}
      isOwner={true}
      updateProfile={updateProfile}
      upsertEntry={upsertEntry}
      removeEntry={removeEntry}
      ownFavorites={favorites}
      toggleFavorite={toggleFavorite}
      isFavorite={isFavorite}
      reorderFavorites={reorderFavorites}
      onViewProfile={onViewProfile}
    />
  )
}
