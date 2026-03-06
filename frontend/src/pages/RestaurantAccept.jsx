import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiHeart, FiRefreshCw } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

function isNgoRequest(item) {
  return String(item?.notes || '').includes('[NGO_REQUEST]')
}

export default function RestaurantAccept() {
  const { restaurantId } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const pendingRequests = useMemo(
    () => requests.filter(item => item.status === 'pending' && isNgoRequest(item)),
    [requests]
  )

  async function fetchRequests(silent = false) {
    if (!restaurantId) return
    if (!silent) setLoading(true)
    try {
      const items = await api.getDonations({ restaurant_id: restaurantId })
      setRequests((items || []).filter(isNgoRequest))
    } catch {
      if (!silent) setRequests([])
    }
    if (!silent) setLoading(false)
  }

  async function acceptRequest(donationId) {
    setActionLoadingId(donationId)
    try {
      await api.updateDonation(donationId, { status: 'matched' })
      setRequests(prev => prev.map(item => (
        item.id === donationId ? { ...item, status: 'matched' } : item
      )))
    } finally {
      setActionLoadingId(null)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [restaurantId]) // eslint-disable-line

  if (!restaurantId) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem 90px', color: '#94a3b8' }}>
        Restaurant profile is not linked yet. Please complete restaurant registration.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1.5rem 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiHeart color="#22c55e" /> NGO Request <span className="gradient-text">Accept</span>
          </h1>
          <p style={{ color: '#64748b', marginTop: 6 }}>Accept food requests submitted by NGOs for your restaurant.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/accept-status" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            View Status
          </Link>
          <button className="btn-secondary" onClick={() => fetchRequests()} disabled={loading}>
            <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="glass" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          No pending NGO requests for your restaurant.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {pendingRequests.map(request => (
            <div key={request.id} className="glass" style={{ padding: '1rem 1.1rem', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{request.ngo_name || `NGO #${request.ngo_id}`}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: 3 }}>
                    Request #{request.id} · {request.food_quantity} meals · {request.food_type || 'mixed'}
                  </div>
                  {request.pickup_time && (
                    <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginTop: 4 }}>
                      Needed by: {new Date(request.pickup_time).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
                <button
                  className="btn-primary"
                  onClick={() => acceptRequest(request.id)}
                  disabled={actionLoadingId === request.id}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <FiCheckCircle size={15} /> {actionLoadingId === request.id ? 'Accepting…' : 'Accept Request'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
