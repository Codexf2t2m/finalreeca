import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  agreed: boolean;
  setAgreed: (agreed: boolean) => void;
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
            <p className="font-semibold">1. Travel and Connection Policy</p>
            <p>
              Reeca Travel is not responsible for missed onward connections due to delays or cancellations.
              We strive to maintain schedules but do not guarantee arrival or departure times.
              Customers are advised to plan connections with sufficient time buffers.
            </p>

            <p className="font-semibold">2. Cancellation and Refund Policy</p>
            <p>
              Cancellations made at least 48 hours before departure are eligible for a full refund.
              Cancellations within 48 hours of departure may incur a fee of up to 50% of the booking cost.
              No refunds are provided for no-shows or cancellations after departure.
            </p>

            <p className="font-semibold">3. Baggage Policy</p>
            <p>
              Each passenger is allowed one carry-on and one checked baggage up to 23 kg.
              Additional or overweight baggage will incur extra charges.
              Reeca Travel is not liable for lost or damaged baggage; travel insurance is recommended.
            </p>

            <p className="font-semibold">4. Check-in and Boarding Policy</p>
            <p>
              Passengers must check-in at least 1 hour before domestic flights and 2 hours before international flights.
              Boarding gates close 15 minutes before departure; late arrivals may not be accommodated.
            </p>

            <p className="font-semibold">5. Infant and Child Policy</p>
            <p>
              Infants under 2 years travel free but must be accompanied by an adult.
              Children aged 2-11 years are eligible for discounted fares.
              Strollers and car seats can be checked in free of charge.
            </p>

            <p className="font-semibold">6. Travel Insurance Policy</p>
            <p>
              Travel insurance is not included in the ticket price but is highly recommended.
              Reeca Travel partners with reputable insurance providers for comprehensive coverage options.
            </p>

            <p className="font-semibold">7. Customer Conduct Policy</p>
            <p>
              Passengers are expected to conduct themselves respectfully and follow crew instructions.
              Disruptive behavior may result in denied boarding or removal from the trip without refund.
            </p>

            <p className="font-semibold">8. Changes and Amendments Policy</p>
            <p>
              Changes to bookings may be subject to availability and additional fees.
              Name changes are not permitted; tickets are non-transferable.
            </p>

            <p className="font-semibold">9. Health and Safety Policy</p>
            <p>
              Passengers must comply with all health and safety regulations.
              Failure to comply may result in denied boarding or removal from the trip.
            </p>

            <p className="font-semibold">10. Liability Policy</p>
            <p>
              Reeca Travel's liability for any single claim is limited to the fare paid.
              We are not liable for indirect or consequential damages.
            </p>

            <p className="font-semibold">11. Pet Policy</p>
            <p>
              Pets are allowed on certain trips with prior approval and may incur additional fees.
              Pets must be secured in appropriate carriers and comply with health regulations.
            </p>

            <p className="font-semibold">12. Special Assistance Policy</p>
            <p>
              Passengers requiring special assistance should notify Reeca Travel at least 48 hours in advance.
              We strive to accommodate all passengers' needs to ensure a comfortable journey.
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
  );
}
