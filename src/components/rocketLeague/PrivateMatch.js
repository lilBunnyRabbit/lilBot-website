import React, { useState, useEffect, useRef } from 'react';
import { 
  Row, Button, ButtonGroup, Table, 
  Container, InputGroup, FormControl,
  Dropdown
} from 'react-bootstrap';
import "../../css/PrivateMatch.css";
import io from 'socket.io-client';
import ErrorAlert from "../common/ErrorAlert";
import CardColumn from "../common/CardColumn";
import Queue from "../common/Queue";

const socket = io("http://localhost:7777/rl/privateMatch", { 
  query: { username: "abc", password: 12312 } 
});  

function PrivateMatch(props) {
    const [loadData, setLoadData] = useState(true);

    const [match, setMatch] = useState({});
    const [activeMatch, setActiveMatch] = useState([]);
    const [queue, setQueue] = useState([]);
    const [filters, setFilters] = useState([]);

    const [alert, setAlert] = useState({ show: false, info: "" });  

    const mUsername = useRef(null);
    const mPassword = useRef(null);

    useEffect(() => {
        socket.on("match", (data) => !!data && setMatch(data));
        socket.on("activeMatch", (data) => !!data && setActiveMatch(data));
        socket.on("queue", (data) => !!data && setQueue(data));
        socket.on("reqError", (data) => !!data && setAlert({ show: true, info: data.error }));

        socket.emit("getData", {
          match: true, activeMatch: true, queue: true
        });
    }, [loadData]);

    function makeDummyQueue() {
        const dummyQueue = [
            { username: "Player 1",  moderator: true, subscriber: false, id:"1"},
            { username: "Player 2",  moderator: false, subscriber: true, id:"2"},
            { username: "Player 3",  moderator: true,  subscriber: false, id:"4"},
            { username: "Player 4",  moderator: true,  subscriber: true, id:"5"},
            { username: "Player 5",  moderator: false, subscriber: true, id:"6"},
            { username: "Player 6",  moderator: false, subscriber: false, id:"7"},
            { username: "Player 7",  moderator: true,  subscriber: false, id:"8"},
            { username: "Player 8",  moderator: true,  subscriber: true, id:"9"},
            { username: "Player 9",  moderator: false, subscriber: false, id:"10"},
            { username: "Player 10", moderator: true,  subscriber: true, id:"11"},
            { username: "Player 11", moderator: true,  subscriber: false, id:"12"},
            { username: "Player 12", moderator: true,  subscriber: true, id:"13"},
            { username: "Player 13", moderator: false, subscriber: false, id:"14"},
            { username: "Player 14", moderator: true,  subscriber: true, id:"15"},
            { username: "Player 15", moderator: false, subscriber: true, id:"160"}
        ];
        // socket.emit("setData", dummyQueue);
        setQueue(dummyQueue);
    }

    return (
      <Container>
        <br/>
        <ErrorAlert target={ this } alert={ alert } setAlert={ setAlert }/>

        <Row className="r-row">
          <CardColumn title="Create" content={ <RenderCreateMatch /> } />
          <CardColumn title="Match" content={ <RenderMatchInfo /> } />
        </Row>  

        <br/>

        <Row className="r-row">
          <CardColumn title="Queue" content={ 
            <Queue queue={ queue }
                   leaveQueue={ (id) => socket.emit("leaveQueue", { id }) }
                   filters={ filters }
                   setFilters={ setFilters }/>
           }/>
          <CardColumn title="Active Match" content={ <RenderActiveMatch /> } />
        </Row>

        <br/><br/><br/>

        <ButtonGroup aria-label="Basic example" style={{width:"100%"}}>
          <Button variant="secondary" style={{width:"50%"}} onClick={makeDummyQueue}> DUMMY </Button>
          <Button variant="secondary" style={{width:"50%"}} onClick={() => socket.emit("setData", {queue: {}})}> Clear Match </Button>
        </ButtonGroup>
      </Container>
    );

    function RenderCreateMatch() {
      async function createMatch() {
          return socket.emit("createMatch", {
              username: mUsername.current.value,
              password: mPassword.current.value
          });
      }

      return (
        <div>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text id="inputGroup-username">Username</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl                 
              ref={ mUsername }
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text id="inputGroup-password">Password</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl 
              ref={ mPassword }
              placeholder="Auto Generated" 
            />
          </InputGroup>
          <Button 
              variant="secondary" 
              type="button"
              onClick={ createMatch } 
              style={{width:"100%"}}
          > Submit </Button>
        </div>
      );
    }

    function RenderMatchInfo() {
        return (
          <div>
            <Table striped bordered hover>
              <tbody>
                <tr>
                  <td style={{width:"2%"}}>Username</td>
                  <td>{ match?.username }</td>
                </tr>
                <tr>
                  <td style={{width:"2%"}}>Password</td>
                  <td>{ match?.password }</td>
                </tr>
              </tbody>
            </Table>
            <Button 
              variant="secondary" 
              type="button"
              onClick={() => socket.emit("newPassword", { password: mPassword.current.value })} 
              style={{width:"100%"}}
            > New Password </Button>
          </div>
        );
    }

    function RenderActiveMatch() {
        const readdParticipant = async (id) => {
            const participant = activeMatch?.players.find(p => p.id == id);
            const hasParticipant = queue.find(p => p.id == id);
            if(!participant || hasParticipant) return;
            socket.emit("joinQueue", participant);
        }

        const updateDropdown = (gamemode) => {
            setMatch({
                ...match,
                gamemode
            });
        }

        return (
          <div>
            <Dropdown style={{width:"100%", marginBottom: "3%"}} onSelect={ updateDropdown }>
              <Dropdown.Toggle variant="secondary" id="dropdown-basic" style={{width:"100%"}}>
              { match?.gamemode ? `${match?.gamemode}v${match?.gamemode}` : "Select game mode"}
              </Dropdown.Toggle>

              <Dropdown.Menu style={{width:"100%"}}>
                <Dropdown.Item eventKey="1">1v1</Dropdown.Item>
                <Dropdown.Item eventKey="2">2v2</Dropdown.Item>
                <Dropdown.Item eventKey="3">3v3</Dropdown.Item>
                <Dropdown.Item eventKey="4">4v4</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Button
              variant="secondary" 
              style={{ width: "100%" }}
              onClick={ () => socket.emit("startMatch") }
              disabled={ !match?.username || !match?.password }
            > Start Match </Button>

            { activeMatch?.username && activeMatch?.password &&
              <Table striped bordered hover style={{marginTop:"5%"}}>
                <tbody>
                  <tr>
                    <td style={{width:"2%"}}>Username</td>
                    <td>{ activeMatch?.username }</td>
                  </tr>
                  <tr>
                    <td style={{width:"2%"}}>Password</td>
                    <td>{ activeMatch?.password }</td>
                  </tr>
                  <tr>
                    <td style={{width:"2%"}}>Type</td>
                    <td>{ activeMatch?.subsOnly ? "Subscribers only" : "Everyone" }</td>
                  </tr>
                </tbody>
              </Table>
            }

            { activeMatch?.players &&
              <Table striped bordered style={{marginTop:"5%"}}>
                <tbody>
                  { 
                    activeMatch.players.map(p => (
                      <tr>
                        <td className="participants-btn-td">
                          <Button 
                            variant="outline-success" 
                            onClick={(e) => {
                              readdParticipant(p.id);
                              e.target.disabled = true;
                            }}
                          > ← </Button>
                        </td>
                        <td>
                          <p style={{ color: `${ p.moderator ? "green" : p.subscriber ? "purple" : "black"}`}}>
                              {p.moderator ? "⚔️ " : ""}{p.subscriber ? "🥔 " : ""}{ p.username }
                          </p>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </Table>
            }
          </div>
        );
    }
}

export default PrivateMatch;