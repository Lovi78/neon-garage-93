/* Stable, saved limits prevent retries and reloads from rerolling a negotiation. */
window.NG = window.NG || {};
NG.purchaseQuote = (car) => car.negotiation?.price ?? car.ask;
NG.hagglePurchase = (s, id, bid, rng = Math.random) => {
  const car = s.market.find((c) => c.id === id);
  if (!car) throw Error("This listing is no longer available.");
  if (s.inventory.length >= s.capacity)
    throw Error("Your garage is full. Sell a car first.");
  const n = car.negotiation;
  if (n?.closed) throw Error("This negotiation is finished.");
  const current = NG.purchaseQuote(car);
  if (!Number.isInteger(bid) || bid < 100 || bid >= current)
    throw Error(
      "Offer a whole-dollar amount below the seller’s current price (minimum $100).",
    );
  if (bid > s.cash) throw Error("You cannot offer more cash than you have.");
  if (n && bid <= n.lastBid)
    throw Error("Raise your offer to keep the conversation moving.");
  const deal =
    n ||
    (car.negotiation = {
      price: car.ask,
      rounds: 0,
      lastBid: 0,
      closed: false,
      walked: false,
      minimum: Math.max(
        100,
        Math.round(
          car.ask *
            NG.clamp(
              0.83 +
                rng() * 0.1 -
                Math.min(s.reputation, 20) * 0.001 -
                (s.progress?.negotiation || 0) * 0.01 -
                (car.inspected && car.flaws.some((f) => !f.fixed) ? 0.025 : 0),
              0.78,
              0.95,
            ),
        ),
      ),
    });
  deal.rounds++;
  deal.lastBid = bid;
  if (bid < current * 0.65) {
    deal.walked = true;
    deal.closed = true;
    deal.message = "Seller: “That’s not a serious offer. The deal is off.”";
  } else if (bid >= deal.minimum) {
    deal.price = bid;
    deal.closed = true;
    deal.message = "Seller: “All right. " + NG.money(bid) + " and it’s yours.”";
  } else {
    deal.price = Math.max(
      deal.minimum,
      Math.round(current - (current - bid) * 0.45),
    );
    if (deal.rounds >= NG.sellerRounds(s)) {
      deal.closed = true;
      deal.message =
        "Seller: “" +
        NG.money(deal.price) +
        ". Final price. Take it or leave it.”";
    } else
      deal.message =
        "Seller: “I can do " +
        NG.money(deal.price) +
        ". Can you come up a little?”";
  }
  return deal.message;
};
NG.haggleSale = (s, id, offerId, price, rng = Math.random) => {
  const car = s.inventory.find((c) => c.id === id),
    offer = car?.offers.find((o) => o.id === offerId);
  if (!car || !car.listed || !offer)
    throw Error("This offer is no longer valid.");
  if (NG.busy(s, car)) throw Error("Wait for the repair to finish first.");
  if (offer.negotiation?.closed)
    throw Error("This buyer has made their final offer.");
  if (!Number.isInteger(price) || price <= offer.price || price > car.listPrice)
    throw Error(
      "Counter above the current offer, up to your listed price, in whole dollars.",
    );
  const n =
    offer.negotiation ||
    (offer.negotiation = {
      rounds: 0,
      closed: false,
      openingPrice: offer.price,
      budget: Math.min(
        car.listPrice,
        Math.round(
          offer.price *
            (1.025 +
              rng() * 0.095 +
              Math.min(s.reputation, 20) * 0.001 +
              (s.progress?.negotiation || 0) * 0.01),
        ),
      ),
    });
  n.rounds++;
  if (price > n.budget * 1.12) {
    car.offers = car.offers.filter((o) => o.id !== offerId);
    car.buyerMessage = offer.buyer + ": “Too steep for me. I’ll keep looking.”";
    return car.buyerMessage;
  }
  if (price <= n.budget) {
    offer.price = price;
    n.closed = true;
    n.message = "“Deal. " + NG.money(price) + " works for me.”";
  } else {
    offer.price = n.budget;
    n.closed = true;
    n.message =
      "“" + NG.money(offer.price) + " is my limit. That’s my final offer.”";
  }
  return offer.buyer + ": " + n.message;
};
