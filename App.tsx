import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Auth from './Auth';
import * as apiService from './services/apiService';
import { ttsService } from './services/audioService';
// FIX: Add missing type imports for EnvelopeTypeId and UpgradeId.
import { CatImage, Phrase, UserProfile, Envelope, GameUpgrade, DailyPassStatus, Achievement, AchievementUnlockResponse, ApiRequestResponse, EnvelopeTypeId, UpgradeId } from './types';

// Pages
import HomePage from './pages/HomePage';
import AlbumPage from './pages/AlbumPage';
import ShopPage from './pages/ShopPage';
import PhraseEditorPage from './pages/PhraseEditorPage';
import GameModeSelector from './components/GameModeSelector';
import CommunityView from './components/CommunityView';
import AdminPanel from './components/AdminPanel';
import AchievementsPage from './pages/AchievementsPage';

// Components
import Header from './hooks/Header';
import MobileMenu from './components/MobileMenu';
import FullDisplay from './components/FullDisplay';
import ImageSelector from './components/ImageSelector';
import ShopModal from './components/ShopModal';
import EnvelopeModal from './components/EnvelopeModal';
import CustomPhraseModal from './components/CustomPhraseModal';
import Toast from './components/Toast';
import DailyPassModal from './components/DailyPassModal';
import EditProfileModal from './components/EditProfileModal';

import { SpinnerIcon } from './hooks/Icons';

type Page = 'home' | 'album' | 'shop' | 'phrases' | 'games' | 'community' | 'admin' | 'achievements';

const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently, logout } = useAuth0();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allImages, setAllImages] = useState<CatImage[]>([]);
  const [shopData, setShopData] = useState<{envelopes: Record<string, Envelope>, upgrades: Record<string, GameUpgrade>} | null>(null);
  const [achievementsData, setAchievementsData] = useState<Achievement[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [fullDisplayPhrase, setFullDisplayPhrase] = useState<{ phrase: Phrase; image: CatImage | null } | null>(null);
  const [imageSelectorPhrase, setImageSelectorPhrase] = useState<Phrase | null>(null);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [newlyUnlockedImages, setNewlyUnlockedImages] = useState<{images: CatImage[], envelopeName: string}>({images: [], envelopeName: ''});
  const [phraseToEdit, setPhraseToEdit] = useState<Phrase | null>(null);
  const [isNewPhrase, setIsNewPhrase] = useState(false);
  const [isDailyPassModalOpen, setIsDailyPassModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  
  const [toastMessage, setToastMessage] = useState('');
  const [dailyPassStatus, setDailyPassStatus] = useState<DailyPassStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const processApiResponse = useCallback((response: ApiRequestResponse) => {
    if (response?.newlyUnlockedAchievements && response.newlyUnlockedAchievements.length > 0) {
      for (const unlock of response.newlyUnlockedAchievements) {
        setTimeout(() => {
          showToast(`🏆 Logro Desbloqueado: ${unlock.achievement.name}!`);
        }, 500); // Stagger toasts
      }
    }
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const saveData = useCallback(async (dataToSave: Partial<UserProfile['data']>) => {
    if (!userProfile) return;
    try {
      const token = await getAccessTokenSilently();
      const newProfileData: UserProfile['data'] = { ...userProfile.data, ...dataToSave };
      
      const res = await apiService.saveUserData(token, newProfileData);
      processApiResponse(res);
      
      const newLastModified = res.lastModified || new Date().toISOString();
      setUserProfile(prev => prev ? ({ ...prev, data: newProfileData, lastModified: newLastModified }) : null);

    } catch (err) {
      console.error('Failed to save data:', err);
      setError('No se pudo guardar el progreso. Por favor, comprueba tu conexión.');
    }
  }, [userProfile, getAccessTokenSilently, processApiResponse]);

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isAuthenticated && userProfile) {
        setIsSyncing(true);
        try {
          const token = await getAccessTokenSilently();
          const updatedProfile = await apiService.syncUserData(token, userProfile.lastModified);
          if (updatedProfile) {
            setUserProfile(updatedProfile);
            setToastMessage("Tus datos han sido actualizados desde otra sesión.");
          }
        } catch (err) {
          if ((err as any)?.response?.status !== 304) console.error("Sync error:", err);
        } finally {
          setIsSyncing(false);
        }
      }
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, userProfile, getAccessTokenSilently]);
  
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsAppLoading(true);
    try {
        const token = await getAccessTokenSilently();
        const [profile, images, achievements] = await Promise.all([
            apiService.getUserData(token),
            apiService.getCatalog(),
            apiService.getAchievementsData(token)
        ]);
        setUserProfile(profile);
        setAllImages(images);
        setAchievementsData(achievements);

        const fetchedShopData = await apiService.getShopData(token);
        setShopData(fetchedShopData);

    } catch (err) {
        console.error('Initialization error:', err);
        setError('No se pudieron cargar los datos de la aplicación. Por favor, inténtalo de nuevo más tarde.');
        if ((err as any)?.response?.status === 401) {
            logout({ logoutParams: { returnTo: window.location.origin }});
        }
    } finally {
        setIsAppLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently, logout]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // Handlers
  const handlePhraseClick = (phrase: Phrase, image: CatImage | null) => {
    setFullDisplayPhrase({ phrase, image });
    handleSpeak(phrase.text);
  };

  const handleSelectImage = async (phraseId: string, imageId: number | null) => {
    if (!userProfile) return;
    const newPhrases = userProfile.data.phrases.map(p => 
      p.id === phraseId ? { ...p, selectedImageId: imageId } : p
    );
    await saveData({ phrases: newPhrases });
    setImageSelectorPhrase(null);
  };

  const handleSpeak = (text: string) => {
    ttsService.speak(text);
  };
  
  const handlePurchaseEnvelope = async (envelopeId: EnvelopeTypeId) => {
    if (!userProfile || !shopData) return;
    const envelope = shopData.envelopes[envelopeId];
    if (!envelope) return;

    try {
        const token = await getAccessTokenSilently();
        const res = await apiService.purchaseEnvelope(token, envelopeId);
        processApiResponse(res);
        
        const newUnlockedIds = [...userProfile.data.unlockedImageIds, ...res.newImages.map(img => img.id)];
        
        // Update local state optimistically before full save
        setUserProfile(prev => prev ? ({
            ...prev,
            data: {
                ...prev.data,
                coins: res.updatedCoins,
                unlockedImageIds: newUnlockedIds,
                stats: {
                  ...prev.data.stats,
                  envelopesOpened: (prev.data.stats.envelopesOpened || 0) + 1
                }
            },
            lastModified: res.lastModified || new Date().toISOString()
        }) : null);

        setNewlyUnlockedImages({images: res.newImages, envelopeName: envelope.name});
    } catch (err: any) {
        showToast(err.response?.data?.message || '¡La compra ha fallado!');
    }
  };

  const handlePurchaseUpgrade = async (upgradeId: UpgradeId) => {
      if (!userProfile) return;
      try {
          const token = await getAccessTokenSilently();
          const res = await apiService.purchaseUpgrade(token, upgradeId);
          processApiResponse(res);

          const newUpgrades = [...userProfile.data.purchasedUpgrades, upgradeId];
          await saveData({ coins: res.updatedCoins, purchasedUpgrades: newUpgrades });
          showToast("¡Mejora comprada!");
      } catch (err: any) {
          showToast(err.response?.data?.message || '¡La compra ha fallado!');
      }
  };

  const handleSavePhrase = async (data: { text: string; selectedImageId: number | null; privacy: Phrase['privacy'] }) => {
    if (!userProfile) return;
    
    let newPhrases: Phrase[];
    let phraseToPublish: Phrase | null = null;
    
    if (isNewPhrase) {
      const newPhrase: Phrase = {
        id: `custom_${Date.now()}`,
        text: data.text,
        selectedImageId: data.selectedImageId,
        isCustom: true,
        privacy: data.privacy,
      };
      newPhrases = [...userProfile.data.phrases, newPhrase];
      phraseToPublish = newPhrase;
    } else if (phraseToEdit) {
      newPhrases = userProfile.data.phrases.map(p =>
        p.id === phraseToEdit.id ? { ...p, text: data.text, selectedImageId: data.selectedImageId, privacy: data.privacy } : p
      );
      phraseToPublish = newPhrases.find(p => p.id === phraseToEdit.id) || null;
    } else {
        return;
    }

    const isNowPublic = data.privacy === 'public' || data.privacy === 'friends';
    const wasPublic = phraseToEdit?.privacy === 'public' || phraseToEdit?.privacy === 'friends';
    
    const publicPhraseCount = userProfile.data.stats.publicPhrases || 0;
    let newPublicPhraseCount = publicPhraseCount;
    if (isNowPublic && !wasPublic) {
        newPublicPhraseCount++;
    } else if (!isNowPublic && wasPublic) {
        newPublicPhraseCount--;
    }
    
    await saveData({ phrases: newPhrases, stats: { ...userProfile.data.stats, publicPhrases: newPublicPhraseCount }});
    
    if (phraseToPublish) {
        try {
            const token = await getAccessTokenSilently();
            const image = allImages.find(img => img.id === phraseToPublish!.selectedImageId);
            if(image) {
                const res = await apiService.publishPhrase(token, phraseToPublish, image, data.privacy);
                processApiResponse(res);
                setUserProfile(prev => prev ? ({...prev, lastModified: res.lastModified || new Date().toISOString() }) : null);
            }
        } catch (err) {
            console.error("Failed to publish phrase", err);
        }
    }
    setPhraseToEdit(null);
    setIsNewPhrase(false);
  };
  
  const handleDeletePhrase = async (phraseId: string) => {
      if (!userProfile) return;
      if (!window.confirm("¿Estás seguro de que quieres eliminar esta frase?")) return;
      const newPhrases = userProfile.data.phrases.filter(p => p.id !== phraseId);
      await saveData({ phrases: newPhrases });
      setPhraseToEdit(null);
  };

  const handleSetPhraseToEdit = (phrase: Phrase | null) => {
      if (phrase) {
          setIsNewPhrase(false);
          setPhraseToEdit(phrase);
      } else {
          setIsNewPhrase(true);
          setPhraseToEdit({ id: '', text: '', selectedImageId: null, isCustom: true, privacy: 'private' });
      }
  };

  const fetchDailyPassStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
        const token = await getAccessTokenSilently();
        const status = await apiService.getDailyPassStatus(token);
        setDailyPassStatus(status);
    } catch (err) {
        console.error("Failed to get daily pass status", err);
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  useEffect(() => {
    fetchDailyPassStatus();
  }, [fetchDailyPassStatus]);
  
  const handleOpenDailyPass = () => {
    fetchDailyPassStatus();
    setIsDailyPassModalOpen(true);
  };

  const handleClaimDailyPass = async () => {
      if (!userProfile) return;
      try {
          const token = await getAccessTokenSilently();
          const res = await apiService.claimDailyPass(token);
          processApiResponse(res);
          
          const newUnlockedIds = [...new Set([...userProfile.data.unlockedImageIds, ...res.unlockedImages.map(img => img.id)])];
          await saveData({ coins: res.updatedCoins, unlockedImageIds: newUnlockedIds });

          showToast("¡Recompensa diaria reclamada!");
          setIsDailyPassModalOpen(false);
          fetchDailyPassStatus();
      } catch (err) {
          showToast("No se pudo reclamar la recompensa.");
      }
  };

  const handleGameEnd = async ({ score, coinsEarned, xpEarned }: { score: number; coinsEarned: number; xpEarned: number; }) => {
    if (!userProfile) return;

    let { level, xp, xpToNextLevel } = userProfile.data.playerStats;
    let newXp = xp + xpEarned;
    
    let levelUps = 0;
    while (newXp >= xpToNextLevel) {
        level += 1;
        newXp -= xpToNextLevel;
        xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
        levelUps++;
    }
    if (levelUps > 0) {
        showToast(`¡Subiste al Nivel ${level}!`);
    }

    const newPlayerStats = { ...userProfile.data.playerStats, level, xp: newXp, xpToNextLevel };
    const newCoins = userProfile.data.coins + coinsEarned;
    const newGamesPlayed = (userProfile.data.stats.gamesPlayed || 0) + 1;
    
    await saveData({ playerStats: newPlayerStats, coins: newCoins, stats: {...userProfile.data.stats, gamesPlayed: newGamesPlayed} });
    showToast(`+${coinsEarned} Monedas, +${xpEarned} XP!`);
  };

  const handleSaveProfile = async (username: string, bio: string, profilePictureId: number | null) => {
    if (!userProfile) return;
    const token = await getAccessTokenSilently();
    
    if(profilePictureId !== userProfile.data.profilePictureId) {
        await apiService.updateProfilePicture(token, profilePictureId);
    }
    if(username !== userProfile.email || bio !== userProfile.data.bio) {
        await apiService.updateProfile(token, username, bio);
    }
    
    // Refresh user data from server to get the latest state
    await loadInitialData();
    
    setIsEditProfileModalOpen(false);
    showToast("¡Perfil guardado!");
  };

  if (isAuthLoading || (isAuthenticated && isAppLoading)) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-100">
        <SpinnerIcon className="w-12 h-12 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }
  
  if (error || !userProfile) {
    return <div className="text-center p-8 text-red-500">{error || 'No se pudo cargar el perfil del usuario.'}</div>;
  }
  
  const unlockedImages = allImages.filter(img => userProfile.data.unlockedImageIds.includes(img.id));
  const profilePicture = allImages.find(img => img.id === userProfile.data.profilePictureId) || null;
  
  const renderPage = () => {
    switch(currentPage) {
        case 'home':
            return <HomePage phrases={userProfile.data.phrases} allImages={allImages} onPhraseClick={handlePhraseClick} onSelectImageClick={setImageSelectorPhrase} onSpeak={handleSpeak} onOpenPhraseEditor={() => handleSetPhraseToEdit(null)} />;
        case 'album':
            return <AlbumPage allImages={allImages} unlockedImageIds={userProfile.data.unlockedImageIds} />;
        case 'shop':
            return <ShopPage onOpenShop={() => setIsShopModalOpen(true)} />;
        case 'phrases':
            return <PhraseEditorPage phrases={userProfile.data.phrases} allImages={allImages} onSetPhraseToEdit={handleSetPhraseToEdit} onDeletePhrase={handleDeletePhrase} />;
        case 'games':
            return <GameModeSelector unlockedImages={unlockedImages} upgrades={userProfile.data.purchasedUpgrades} onGameEnd={handleGameEnd} />;
        case 'community':
            return <CommunityView currentUserProfile={userProfile} />;
        case 'admin':
            return userProfile.role === 'admin' ? <AdminPanel /> : <div>Acceso Denegado</div>;
        case 'achievements':
            return <AchievementsPage allAchievements={achievementsData} userProfile={userProfile} />;
        default:
            return <HomePage phrases={userProfile.data.phrases} allImages={allImages} onPhraseClick={handlePhraseClick} onSelectImageClick={setImageSelectorPhrase} onSpeak={handleSpeak} onOpenPhraseEditor={() => handleSetPhraseToEdit(null)} />;
    }
  };

  return (
    <div className="bg-[var(--c-paper)] min-h-screen pb-28">
        <Header 
            userCoins={userProfile.data.coins} 
            playerStats={userProfile.data.playerStats}
            username={userProfile.email}
            profilePicture={profilePicture}
            onOpenShop={() => setIsShopModalOpen(true)}
            onOpenProfile={() => setIsEditProfileModalOpen(true)}
            onNavigate={(page) => setCurrentPage(page)}
            isSyncing={isSyncing}
        />
        <main className="container mx-auto px-4 mt-8 mb-8">
            {renderPage()}
        </main>
        
        {/* Modals & Overlays */}
        {fullDisplayPhrase && (
            <FullDisplay phrase={fullDisplayPhrase.phrase} image={fullDisplayPhrase.image} onClose={() => setFullDisplayPhrase(null)} />
        )}
        <ImageSelector isOpen={!!imageSelectorPhrase} onClose={() => setImageSelectorPhrase(null)} phrase={imageSelectorPhrase} unlockedImages={unlockedImages} onSelectImage={handleSelectImage} />
        {shopData && (
          <ShopModal 
              isOpen={isShopModalOpen} 
              onClose={() => setIsShopModalOpen(false)}
              envelopes={shopData.envelopes}
              upgrades={shopData.upgrades}
              userCoins={userProfile.data.coins}
              playerStats={userProfile.data.playerStats}
              purchasedUpgrades={userProfile.data.purchasedUpgrades}
              onPurchaseEnvelope={handlePurchaseEnvelope}
              onPurchaseUpgrade={handlePurchaseUpgrade}
              onOpenDailyPass={handleOpenDailyPass}
              hasClaimablePass={dailyPassStatus?.isClaimable ?? false}
          />
        )}
        <EnvelopeModal isOpen={newlyUnlockedImages.images.length > 0} onClose={() => setNewlyUnlockedImages({images: [], envelopeName: ''})} newImages={newlyUnlockedImages.images} envelopeName={newlyUnlockedImages.envelopeName} />
        <CustomPhraseModal isOpen={!!phraseToEdit} onClose={() => setPhraseToEdit(null)} onSave={handleSavePhrase} onDelete={handleDeletePhrase} phraseToEdit={isNewPhrase ? null : phraseToEdit} unlockedImages={unlockedImages} />
        <DailyPassModal isOpen={isDailyPassModalOpen} onClose={() => setIsDailyPassModalOpen(false)} status={dailyPassStatus} onClaim={handleClaimDailyPass} onRefreshStatus={fetchDailyPassStatus}/>
        <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} currentUserProfile={userProfile} unlockedImages={unlockedImages} onSave={handleSaveProfile} />

        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}

        <MobileMenu currentPage={currentPage} setCurrentPage={setCurrentPage} isAdmin={userProfile.role === 'admin'} />
    </div>
  );
};

export default App;
