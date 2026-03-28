"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { checkIn, checkOut } from "@/lib/actions/attendance"
import { Loader2, MapPin, Clock, LogOut, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { CountdownTimer } from "./CountdownTimer"

export default function CheckInCard({ todayRecord }: { todayRecord: any }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const isCheckedIn = !!todayRecord
  const isCheckedOut = !!todayRecord?.checkOut

  const handleAction = () => {
    setLoading(true)
    setMessage(null)

    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        let result
        
        if (isCheckedIn && !isCheckedOut) {
          result = await checkOut(latitude, longitude)
        } else if (!isCheckedIn) {
          result = await checkIn(latitude, longitude)
        } else {
             setMessage("You have already completed your attendance for today.")
             setLoading(false)
             return
        }

        if (result.error) {
          setMessage(result.error)
        } else {
           // Reload to reflect changes
           window.location.reload()
        }
        setLoading(false)
      },
      (error) => {
        setMessage("Unable to retrieve location. Please allow location access in your browser.")
        setLoading(false)
      }
    )
  }

    // 3. User requested BUTTONS ALWAYS VISIBLE.
    // If checked out, show "Shift Completed" message BUT show "Check In" button again for new session.
    // Logic: 
    // - If isCheckedIn && !isCheckedOut -> Show Check Out button + Timer
    // - If !isCheckedIn (No record OR Checked Out) -> Show Check In button.
    // - If isCheckedOut (Latest record is checked out) -> Show Success Message + Check In button.

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-full flex flex-col overflow-hidden bg-white">
      <div className="p-6 border-b bg-muted/10">
           <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {isCheckedIn && !isCheckedOut ? "Current Session" : "Attendance Controls"}
           </h3>
      </div>
      
      <div className="flex-1 p-8 flex flex-col justify-center space-y-6">
         {/* Success Message Banner if Checked Out */}
         {isCheckedOut && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center mb-4">
                 <h4 className="text-green-800 font-bold text-lg">Shift Completed</h4>
                 <p className="text-green-700 text-sm">Great job! You have logged out for today.</p>
                 <p className="text-green-600 text-xs mt-1">Total Hours: {todayRecord.totalHours} hrs</p>
            </div>
         )}
         
         {/* Active Session Info */}
         {isCheckedIn && !isCheckedOut && (
             <div className="text-center space-y-4">
                 <CountdownTimer />
                 
                 <div className="inline-flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl border border-blue-100 w-full transition-all">
                     <span className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-1">Checked In At</span>
                     <span className="text-3xl font-bold text-blue-900 mono">{new Date(todayRecord.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
                 
                 <div className="flex items-center justify-center gap-2 pt-2">
                     <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", todayRecord.inStatus === "OUTSIDE" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>
                         <MapPin className="h-3 w-3 mr-1" />
                         {todayRecord.inStatus}
                         <span className="ml-1 text-xs opacity-75">({Math.round(todayRecord.inDistance)}m)</span>
                     </span>
                 </div>
                 
                 {todayRecord.inStatus === "OUTSIDE" && (
                     <p className="text-xs text-amber-600 font-medium">You are currently marked as outside the office radius.</p>
                 )}
             </div>
         )}

         {message && (
             <div className="p-4 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium text-center animate-in fade-in slide-in-from-top-2">
                 {message}
             </div>
         )}
         
         <div className="pt-2">
            <Button 
                onClick={handleAction} 
                disabled={loading} 
                size="lg" 
                className={cn(
                    "w-full h-16 text-lg font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]",
                    isCheckedIn && !isCheckedOut ? "bg-destructive hover:bg-destructive/90 text-white shadow-red-200" : "bg-primary hover:bg-primary/90 text-white shadow-blue-200"
                )}
            >
              {loading ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : isCheckedIn && !isCheckedOut ? (
                  <>
                    <LogOut className="mr-2 h-6 w-6" /> Check Out
                  </>
              ) : (
                  <>
                    <Play className="mr-2 h-6 w-6 fill-current" /> {isCheckedOut ? "Check In Again" : "Check In"}
                  </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
                {isCheckedIn && !isCheckedOut ? "Click to end your shift." : "Click to start tracking your attendance."}
            </p>
         </div>
      </div>
    </div>
  )
}
