'use client'
import { useState, useEffect, useCallback } from 'react' 
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import RecordModal from '@/components/RecordModal'

interface ServiceRecord {
  id: string
  name: string
  phone: string
  bikeType: string
  kmReading: number
  currentDate: string
  nextServiceDate: string
  finalized: boolean
  totalAmount?: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<ServiceRecord[]>([])
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null)
  
  // --- New State for Enhancements ---
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const limit = 10
  
  const [whatsappStatus, setWhatsappStatus] = useState({ status: 'disconnected', qr: null })
  const [showQrModal, setShowQrModal] = useState(false)
  
  const router = useRouter()

  // Centralized fetch logic
  const fetchRecords = useCallback(async () => {
    if (!auth.currentUser) return
    try {
      const token = await auth.currentUser.getIdToken()
      
      // Constructing URL with sorting, pagination, and date filters
      let url = `https://motomind-backend-production.up.railway.app/api/records?page=${page}&limit=${limit}&sort=desc`
      
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      // Ensure local sorting as a fallback (Newest on Top)
      const sorted = (data.records || []).sort((a: any, b: any) => 
        new Date(b.currentDate).getTime() - new Date(a.currentDate).getTime()
      )
      
      setRecords(sorted)
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }, [page, startDate, endDate])

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u)
      } else {
        router.push('/login')
      }
      setLoading(false)
    })
    return () => unsubscribeAuth()
  }, [router])

  // Trigger fetch when user, page, or filters change
  useEffect(() => {
    if (user) fetchRecords()
  }, [user, fetchRecords])

  useEffect(() => {
    if (!user) return
    const unsubSnap = onSnapshot(doc(db, "whatsapp_sessions", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any
        setWhatsappStatus(data)
        if (data.status === 'qr' && data.qr) setShowQrModal(true)
        if (data.status === 'connected') setShowQrModal(false)
      } else {
        setWhatsappStatus({ status: 'disconnected', qr: null })
      }
    })
    return () => unsubSnap()
  }, [user])

  const handleFinalize = async (id: string) => {
    if (!confirm("Finalize this record? You won't be able to edit it anymore.")) return
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch(`https://motomind-backend-production.up.railway.app/api/records/${id}/finalize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchRecords() 
    } catch (error) {
      alert("Failed to finalize record")
    }
  }

  const handleSendBill = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken()
      const response = await fetch(`https://motomind-backend-production.up.railway.app/api/records/${id}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        alert("Bill sent successfully via WhatsApp!")
      } else {
        alert(`Error: ${data.error || 'WhatsApp not ready'}`)
      }
      fetchRecords()
    } catch (error) {
      alert("Failed to process request")
    }
  }

  const handleConnect = async () => {
    const token = await auth.currentUser?.getIdToken()
    await fetch('https://motomind-backend-production.up.railway.app/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  const handleCloseQrModal = async () => {
    setShowQrModal(false)
    const token = await auth.currentUser?.getIdToken()
    await fetch('https://motomind-backend-production.up.railway.app/api/whatsapp/clear-qr', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  const handleLogout = async () => {
    await auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">MotoMind Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${whatsappStatus.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                WA: {whatsappStatus.status.toUpperCase()}
            </span>
            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtering & Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold">Service Records</h2>
            <p className="text-xs text-gray-500">Showing 10 records per page</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filters */}
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1 shadow-sm">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setPage(1); setStartDate(e.target.value); }}
                className="text-sm border-none focus:ring-0 cursor-pointer"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setPage(1); setEndDate(e.target.value); }}
                className="text-sm border-none focus:ring-0 cursor-pointer"
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                  className="ml-2 text-xs text-red-500 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {whatsappStatus.status !== 'connected' && (
              <button onClick={handleConnect} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                Connect WhatsApp
              </button>
            )}
            <button onClick={() => { setEditingRecord(null); setShowRecordModal(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
              + Add Record
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 border-b text-sm font-bold">Date</th>
                <th className="px-4 py-3 border-b text-sm font-bold">Customer</th>
                <th className="px-4 py-3 border-b text-sm font-bold">Bike</th>
                <th className="px-4 py-3 border-b text-sm font-bold">Total Bill</th>
                <th className="px-4 py-3 border-b text-sm font-bold">Status</th>
                <th className="px-4 py-3 border-b text-right text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-gray-600">
                    {new Date(record.currentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-800">{record.name}</p>
                    <p className="text-[10px] text-gray-500">{record.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{record.bikeType}</td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-700">
                    Rs. {record.totalAmount?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${record.finalized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {record.finalized ? 'Finalized' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {!record.finalized ? (
                      <>
                        <button onClick={() => { setEditingRecord(record); setShowRecordModal(true); }} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                        <button onClick={() => handleFinalize(record.id)} className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-black">Finalize</button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleSendBill(record.id)} 
                        disabled={whatsappStatus.status !== 'connected'}
                        className={`px-3 py-1 rounded text-xs text-white font-bold ${whatsappStatus.status === 'connected' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        Send WhatsApp Bill
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500 italic">
                    No records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              Showing page <span className="font-bold">{page}</span>
            </div>
            <div className="flex space-x-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={records.length < limit}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {showRecordModal && (
        <RecordModal 
          record={editingRecord} 
          onClose={() => { setShowRecordModal(false); fetchRecords(); }} 
        />
      )}

      {showQrModal && whatsappStatus.qr && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-sm text-center shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Scan WhatsApp QR</h3>
            <p className="text-gray-500 mb-6 text-sm text-balance">Use WhatsApp on your phone to scan this code to enable bill sending.</p>
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
               <img src={whatsappStatus.qr} alt="WhatsApp QR" className="mx-auto w-56 h-56" />
            </div>
            <button onClick={handleCloseQrModal} className="text-gray-400 hover:text-red-600 text-sm font-medium transition-colors">
              Cancel Connection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
