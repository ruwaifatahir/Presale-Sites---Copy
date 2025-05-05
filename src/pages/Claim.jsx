import Layout from "../Layout";
import Header from "../components/header/v1/Header";
import ClaimBanner from "../sections/banner/v6/ClaimBanner";

const Claim = () => {
  return (
    <Layout pageTitle="DigiToken - Claim">
      <Header variant="v6" />
      <ClaimBanner />
    </Layout>
  );
};

export default Claim;
