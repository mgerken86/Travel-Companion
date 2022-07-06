import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import * as ordersAPI from "../../utilities/tripOrders-api";
import ShowPageSearchBar from "../../components/ShowPageSearchBar/ShowPageSearchBar";

export default function HotelShowPage() {
  // hotel data
  const [hotel, setHotel] = useState({});
  // rooms list data
  const [rooms, setRooms] = useState([]);
  // hotel photos data
  const [photos, setPhotos] = useState([]);
  // room info contains photos
  const [roomPhoto, setRoomPhoto] = useState([]);

  // use navigate
  const navigate = useNavigate();

  const { hotel_id } = useParams();
  // get checkin and checkout date from query
  const queryParams = new URLSearchParams(window.location.search);
  const checkIn = queryParams.get("checkin");
  const checkOut = queryParams.get("checkout");
  const numberOfPerson = queryParams.get("numberOfPerson");

  //any time page re-renders it will get the hotel data
  useEffect(() => {
    const getHotelData = async (url, setState) => {
      const options = {
        method: "GET",
        url: url,
        params: { hotel_id: hotel_id, locale: "en-gb" },
        headers: {
          "X-RapidAPI-Key": process.env.REACT_APP_BOOKING_API_KEY,
          "X-RapidAPI-Host": "booking-com.p.rapidapi.com",
        },
      };

      const response = await axios.request(options).catch(function (error) {
        console.error(error);
      });
      // if (response.data) console.log(response.data);
      setState(response.data);
    };
    // This calls a bunch of different axios urls to get different data and sets state accordingly
    const makeFetchCalls = async () => {
      // the rooms fetch seems deprecated
      // await getHotelData('https://booking-com.p.rapidapi.com/v1/hotels/room-list', setRooms)
      // await getHotelData(
      //   "https://booking-com.p.rapidapi.com/v1/hotels/description",
      //   setDescription
      // );
      await getHotelData(
        "https://booking-com.p.rapidapi.com/v1/hotels/data",
        setHotel
      );
      await getHotelData(
        "https://booking-com.p.rapidapi.com/v1/hotels/photos",
        (data) => {
          // only take first 6 photos
          data = data.slice(0, 6);
          setPhotos(data);
        }
      );
      // reviews fetch also getting 400 status errors
      // await getHotelData('https://booking-com.p.rapidapi.com/v1/hotels/reviews', setReviews)
    };
    makeFetchCalls();

    // get room details
    const getRoomDetails = async () => {
      const options = {
        method: "GET",
        url: "https://booking-com.p.rapidapi.com/v1/hotels/room-list",
        params: {
          checkin_date: checkIn,
          units: "metric",
          checkout_date: checkOut,
          currency: "USD",
          locale: "en-gb",
          adults_number_by_rooms: numberOfPerson,
          hotel_id: hotel_id,
          // children_ages: "",
          // children_number_by_rooms: "",
        },
        headers: {
          "X-RapidAPI-Key": process.env.REACT_APP_BOOKING_API_KEY,
          "X-RapidAPI-Host": "booking-com.p.rapidapi.com",
        },
      };
      const response = await axios.request(options).catch(function (error) {
        console.error(error);
      });
      const rooms = response.data[0].block.slice(0, 6);
      const room = response.data[0].rooms;

      setRoomPhoto(room);

      console.log("roomInfo", response.data);
      setRooms(rooms);
    };
    getRoomDetails();
  }, []);

  // handle onclick
  const handleClick = async (room) => {
    let hotelPhoto = photos[0].url_1440;
    const updatedCart = await ordersAPI.addHotelToCart(
      hotel,
      room,
      checkIn,
      checkOut,
      hotel_id,
      hotelPhoto
    );
    console.log("updatedCart", updatedCart);
    navigate(`/users/cart/checkout/${updatedCart.id}`, {
      state: {
        hotel,
        checkIn,
        checkOut,
        room,
        hotelPhoto,
        hotel_id,
        numberOfPerson,
      },
    });
  };

  return (
    <>
      <ShowPageSearchBar
        checkIn={checkIn}
        checkOut={checkOut}
        numberOfPerson={numberOfPerson}
        hotel_id={hotel_id}
      />
      {/* {photos && <img src={photos[0].url_1440} alt="" />}  */}

      <h1>{hotel.name}</h1>
      {/* <span>{description.description}</span> */}
      <h3>
        Review Score: {hotel.review_score}/10: {hotel.review_score_word}
      </h3>
      <h3>Address:</h3>
      <p>{hotel.address}</p>
      <p>
        {hotel.city}, {hotel.zip}
      </p>
      <div>
        {photos &&
          photos.map((photo, index) => {
            return <img src={photo.url_1440} key={index} alt="" />;
          })}
      </div>

      {rooms &&
        rooms.map((room) => {
          return (
            <div>
              <img
                src={roomPhoto[room.room_id].photos[0].url_original}
                alt=""
              />
              <h4>{room.name}</h4>
              <h4>Max Occupancy: {room.max_occupancy}</h4>
              <h4>Total Cost: $ {room.price_breakdown.gross_price}</h4>
              <button onClick={() => handleClick(room)}>Select</button>
            </div>
          );
        })}
    </>
  );
}
