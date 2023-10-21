import React, { useEffect, useState } from "react";
import { Stack, Row, Col, Card, Button, Nav, Form } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

import Videos from "./Videos";
import { shortenEthereumAddress } from "../utils/shortenEthereumAddress";
import { Web3Button } from "@thirdweb-dev/react";
import { useAddress } from "@thirdweb-dev/react";
import { useContract } from "@thirdweb-dev/react";
import { useSelector } from "react-redux";
import { queryUserFeed } from "../utils/queryLibrary";

import MOOVIE_TIER_NFT_ABI from "../abi/MoovieTierNFT.json";
import config from "../config.json";

const User = () => {
  const provider = useSelector((state) => state.provider.provider);
  const chainId = useSelector((state) => state.provider.chainId) ?? 80001;
  const account = useSelector((state) => state.provider.account);

  const token = useSelector((state) => state.irys.token);
  const node = useSelector((state) => state.irys.node);
  const irys = useSelector((state) => state.irys.irys);
  const balance = useSelector((state) => state.irys.balance);

  const moovieTierNFTContract = useSelector(
    (state) => state.moovieTierNFT.contract
  );

  const [videos, setVideos] = useState([]);
  const [tierName, setTierName] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [tiers, setTiers] = useState([]);

  const contractAccount = account ? account.toLowerCase() : "";
  const location = useLocation();
  const currentRoute = location.pathname;
  const myArray = currentRoute.split("/");
  const user = myArray[2];

  console.log("Contract Account: ", moovieTierNFTContract);
  const [showMint, setShowMint] = useState(false);

  const handleNavLinkSelect = (key) => {
    if (key === "link-2") {
      setShowMint(true);
    } else {
      setShowMint(false);
    }
  };

  const handleCreateTier = async () => {
    console.log(`Handle Create Tier, ${tierName}, ${tierPrice}`);
    try {
      if (tierName !== "" && tierPrice >= 0) {
        const signer = await provider.getSigner();
        const data = await moovieTierNFTContract
          .connect(signer)
          .createTier(tierPrice, tierName);
      }
      window.location.href = `/user/${user}`;
    } catch (error) {
      console.log("Create tier error", error);
    }
  };

  const getCreatorTierIDs = async () => {
    console.log(`Handle Create Tier, ${tierName}, ${tierPrice}`);
    try {
      const data = await moovieTierNFTContract.getCreatorTierIDs(account);
      let tiers = [];
      // console.log("Moovie Tiers: ", moovieTierNFTContract.tiers);
      data.map(async (id) => {
        tiers.push(await moovieTierNFTContract.tiers(id.toNumber()));
      });
      setTiers(tiers);
    } catch (error) {
      console.log("Get creator tiers error \n", error);
    }
  };

  const getVideos = async () => {
    const videos = await queryUserFeed(node, user);
    setVideos(videos);
    return videos;
  };

  useEffect(() => {
    try {
      getVideos();
      getCreatorTierIDs();
    } catch (error) {
      console.log("Error loading video data", error);
    }
  }, [node, moovieTierNFTContract]);

  return (
    <Stack className="align-items-center">
      <Row style={{ marginTop: "20px", marginBottom: "20px", width: "50%" }}>
        <Col xs={1} style={{ marginRight: "0px", padding: "0px" }}>
          <img
            className="rounded-circle shadow-4-strong"
            style={{ height: "60px", width: "60px" }}
            alt="avatar1"
            src="/images/m-logo.png"
          />
        </Col>
        <Col
          xs={2}
          style={{
            width: "40%",
            maxWidth: "600px",
          }}
        >
          <h4 className="mb-0">
            <Link
              style={{ color: "white", textDecoration: "none" }}
              to={`/user/${user}`}
            >
              {shortenEthereumAddress(user)}
            </Link>
          </h4>
        </Col>
        <Col
          xs={2}
          style={{
            width: "40%",
            maxWidth: "600px",
          }}
        >
          {!account ? (
            <Button
              variant="primary"
              // onClick={handleCreateTier}
              disabled
              className="mb-2"
              style={{ backgroundColor: "#FDD600", color: "#FDD600" }}
            >
              Mint Tier
            </Button>
          ) : contractAccount === user ? (
            <Form>
              <Form.Group className="mb-2 mr-sm-2 w-50">
                <Form.Control
                  type="text"
                  id="tierName"
                  placeholder="Tier Name"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                />
                <Form.Control
                  type="number"
                  id="tierPrice"
                  placeholder="Tier Price"
                  value={tierPrice}
                  onChange={(e) => setTierPrice(e.target.value)}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleCreateTier}
                className="mb-2"
                style={{ backgroundColor: "#FDD600", color: "#FDD600" }}
              >
                Create Tier
              </Button>
            </Form>
          ) : (
            <Button
              variant="primary"
              // onClick={handleCreateTier}
              className="mb-2"
              style={{ backgroundColor: "#FDD600", color: "#FDD600" }}
            >
              Mint Tier
            </Button>
          )}
        </Col>
      </Row>
      <Row style={{ width: "50%" }}>
        <Nav
          // fill
          variant="tabs"
          onSelect={(selectedKey) => handleNavLinkSelect(selectedKey)}
        >
          <Nav.Item>
            <Nav.Link eventKey="link-1" style={{ color: "#FDD600" }}>
              Videos
            </Nav.Link>
          </Nav.Item>
          {console.log("Account Tiers: ", tiers)}
          {console.log(
            `Account Tier1 Name: ${tiers[0]}, Account Tier1 Price: ${tiers[0]}  `
          )}
          {tiers &&
            tiers.map((tier) => (
              <Nav.Item>
                <Nav.Link
                  key={tier.indexInCreatorList.toNumber()}
                  eventKey={tier.indexInCreatorList.toNumber()}
                  style={{ color: "#FDD600" }}
                >
                  {tier.name}
                </Nav.Link>
              </Nav.Item>
            ))}
        </Nav>
      </Row>
      <Row style={{ width: "50%" }}>
        <Videos videos={videos ?? []} />
      </Row>
    </Stack>
  );
};

export default User;
