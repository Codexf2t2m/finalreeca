import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PolicyModalProps {
  isOpen: boolean
  onClose: () => void
  onAgree: () => void
  agreed: boolean
  setAgreed: (agreed: boolean) => void
}

export function PolicyModal({ isOpen, onClose, onAgree, agreed, setAgreed }: PolicyModalProps) {
  const handleContinueToPayment = () => {
    if (agreed) {
      onClose(); // Close the modal first
      onAgree(); // Then trigger the payment gateway
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Reeca Travel Policies</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(100%-120px)] px-4">
          <div className="space-y-4 text-sm">
            <p className="font-semibold">1. Travel & Connection Policy</p>
            <p>
              Reeca Travel does not take responsibility for missed onward connections. 
              We do not guarantee arrival or departure times, nor accept liability for 
              inconveniences due to delays or service cancellations.
            </p>

            {/* Add all other policies */}
            
            <p className="font-semibold">12. Infant Luggage Policy</p>
            <p>
              Non-fare-paying infants (under two years) have no luggage allowance but may 
              check in one baby stroller/buggy/pram. Additional items incur a P350 charge each.
            </p>
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>I have read and agree to the travel policies</span>
          </label>
          
          <button
            onClick={handleContinueToPayment}
            disabled={!agreed}
            className={`w-full py-2 px-4 rounded-md text-white transition-colors
              ${agreed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            Continue to Payment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}