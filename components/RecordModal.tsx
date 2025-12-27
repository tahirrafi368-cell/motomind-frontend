'use client'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'

interface RecordModalProps {
  record: any
  onClose: () => void
}

const BIKE_TYPES = ['CD70', 'CD Dream', 'Pridor', 'CG125', 'CG125 Self', 'CB125', 'CB150']

// NEW SERVICES DATA FROM SCREENSHOT
const SERVICES_LIST = [
  { id: 1, name: 'Battery Inspection', suggested: 0 },
  { id: 2, name: 'Tuning and Inspection', suggested: 0 },
  { id: 3, name: 'Oil Change', suggested: 0 },
  { id: 4, name: 'Washing', suggested: 0 },
  { id: 5, name: 'Half Engine overhaul', suggested: 0 },
  { id: 6, name: 'Full Engine overhaul', suggested: 0 },
  { id: 7, name: 'Brake Shoe Replace Front', suggested: 0 },
  { id: 8, name: 'Brake Shoe Replace Rear', suggested: 0 },
  { id: 9, name: 'Chain Sprocket Kit Replacement', suggested: 0 },
  { id: 10, name: 'Clutch overhaul', suggested: 0 },
  { id: 11, name: 'Body Repair', suggested: 50 },
]

// NEW PARTS DATA FROM SCREENSHOT
const PARTS_LIST = [
  { id: 1, name: 'BATTERY (12 V 3.25 Amp)', suggested: 1500 },
  { id: 2, name: 'GENUINE ENGINE OIL 10W30SL/JASO MA2 0.7L', suggested: 905 },
  { id: 3, name: 'SHOE SET, BRAKE WITH LARGE SPRING', suggested: 620 },
  { id: 4, name: 'GENUINE ENGINE OIL 10W30-SL/JASO MA 2 1L', suggested: 1270 },
  { id: 5, name: 'SPARK PLUG(C7HSA)', suggested: 385 },
  { id: 6, name: 'SPARK PLUG (DP8EA-9)', suggested: 385 },
  { id: 7, name: 'PISTON KIT STD.', suggested: 1100 },
  { id: 8, name: 'GENUINE OIL CG125', suggested: 945 },
  { id: 9, name: 'GENUINE OIL CD70', suggested: 670 },
  { id: 10, name: 'GENUINE OIL CD100', suggested: 750 },
  { id: 11, name: 'ELEMENT AIR CLEANER', suggested: 160 : },
  { id: 12, name: 'CHAIN SPROCKET KIT', suggested: 3960 },
  { id: 13, name: 'CHAIN SPROCKET KIT', suggested: 2180 },
  { id: 14, name: 'CABLE FRONT BRAKE', suggested: 510 },
  { id: 15, name: 'CABLE CLUTCH', suggested: 400 },
]

export default function RecordModal({ record, onClose }: RecordModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bikeType: 'CD70',
    kmReading: 0,
    currentDate: new Date().toISOString().split('T')[0],
    nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    // State to track selected items and their custom charges
    selectedServices: {} as Record<string, { quantity: number, charges: number }>,
    selectedParts: {} as Record<string, { quantity: number, charges: number }>,
    laborCharges: 0,
    partsCharges: 0,
  })

  const [loading, setLoading] = useState(false)

  // Calculations for totals
  const totalParts = Object.values(formData.selectedParts).reduce((acc, curr) => acc + (curr.charges * curr.quantity), 0)
  const totalLabor = Object.values(formData.selectedServices).reduce((acc, curr) => acc + (curr.charges * curr.quantity), 0)

  const handleItemToggle = (type: 'parts' | 'services', itemName: string) => {
    const key = type === 'parts' ? 'selectedParts' : 'selectedServices'
    setFormData(prev => {
      const updated = { ...prev[key] }
      if (updated[itemName]) {
        delete updated[itemName]
      } else {
        updated[itemName] = { quantity: 1, charges: 0 }
      }
      return { ...prev, [key]: updated }
    })
  }

  const handleChargeChange = (type: 'parts' | 'services', itemName: string, val: number) => {
    const key = type === 'parts' ? 'selectedParts' : 'selectedServices'
    setFormData(prev => ({
      ...prev,
      [key]: { ...prev[key], [itemName]: { ...prev[key][itemName], charges: val } }
    }))
  }

  const handleSave = async (finalize = false) => {
    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const url = record 
        ? `https://motomind-backend-production.up.railway.app/api/records/${record.id}`
        : 'https://motomind-backend-production.up.railway.app/api/records'
      
      const response = await fetch(url, {
        method: record ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          partsCharges: totalParts,
          laborCharges: totalLabor,
          totalAmount: totalParts + totalLabor,
          finalized: finalize
        })
      })

      if (response.ok) onClose()
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">
            {record ? 'Edit Service Record' : 'New Service Record'}
          </h2>

          <div className="space-y-8">
            {/* 1. CUSTOMER INFO (Converted to English) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bike Model</label>
                <select
                  value={formData.bikeType}
                  onChange={(e) => setFormData({...formData, bikeType: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  {BIKE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Mileage (KM)</label>
                <input
                  type="number"
                  value={formData.kmReading}
                  onChange={(e) => setFormData({...formData, kmReading: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Date</label>
                <input type="date" value={formData.currentDate} disabled className="w-full px-3 py-2 border rounded bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Next Service Date</label>
                <input
                  type="date"
                  value={formData.nextServiceDate}
                  onChange={(e) => setFormData({...formData, nextServiceDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            {/* 2. PARTS TABLE */}
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">📦 Parts</h3>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 w-12 text-center">SR</th>
                      <th className="p-2">Parts</th>
                      <th className="p-2 w-24 text-center">Quantity</th>
                      <th className="p-2 w-32">Charges</th>
                      <th className="p-2 w-32 text-right">Suggested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {PARTS_LIST.map((part) => (
                      <tr key={part.id} className={formData.selectedParts[part.name] ? 'bg-blue-50' : ''}>
                        <td className="p-2 text-center text-gray-500">{part.id}</td>
                        <td className="p-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!formData.selectedParts[part.name]} 
                              onChange={() => handleItemToggle('parts', part.name)}
                              className="w-4 h-4"
                            />
                            {part.name}
                          </label>
                        </td>
                        <td className="p-2 text-center">1</td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            disabled={!formData.selectedParts[part.name]}
                            value={formData.selectedParts[part.name]?.charges || 0}
                            onChange={(e) => handleChargeChange('parts', part.name, parseFloat(e.target.value))}
                            className="w-full border rounded px-1 py-1" 
                          />
                        </td>
                        <td className="p-2 text-right font-bold">{part.suggested}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. SERVICES TABLE */}
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-red-700">🛠 Services</h3>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 w-12 text-center">SR</th>
                      <th className="p-2">Services</th>
                      <th className="p-2 w-32">Charges</th>
                      <th className="p-2 w-32 text-right">Suggested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {SERVICES_LIST.map((service) => (
                      <tr key={service.id} className={formData.selectedServices[service.name] ? 'bg-red-50' : ''}>
                        <td className="p-2 text-center text-gray-500">{service.id}</td>
                        <td className="p-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!formData.selectedServices[service.name]} 
                              onChange={() => handleItemToggle('services', service.name)}
                              className="w-4 h-4"
                            />
                            {service.name}
                          </label>
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            disabled={!formData.selectedServices[service.name]}
                            value={formData.selectedServices[service.name]?.charges || 0}
                            onChange={(e) => handleChargeChange('services', service.name, parseFloat(e.target.value))}
                            className="w-full border rounded px-1 py-1" 
                          />
                        </td>
                        <td className="p-2 text-right font-bold">{service.suggested}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* TOTALS SUMMARY */}
            <div className="bg-blue-600 p-6 rounded-lg text-white grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm opacity-80">Total Parts</p>
                <p className="text-2xl font-bold">{totalParts}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Total Labor</p>
                <p className="text-2xl font-bold">{totalLabor}</p>
              </div>
              <div className="border-l border-blue-400">
                <p className="text-sm opacity-80 uppercase tracking-widest">Grand Total</p>
                <p className="text-3xl font-black">{totalParts + totalLabor}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button onClick={onClose} className="px-6 py-2 border rounded font-medium hover:bg-gray-100">Cancel</button>
            <button onClick={() => handleSave(false)} className="px-6 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600">Save Draft</button>
            <button onClick={() => handleSave(true)} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">Finalize Bill</button>
          </div>
        </div>
      </div>
    </div>
  )
}
