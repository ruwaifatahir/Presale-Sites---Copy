import Layout from "../Layout";
import Header from "../components/header/v1/Header";
import WithdrawBanner from "../sections/banner/v6/WithdrawBanner";

const Withdraw = () => {
  return (
    <Layout pageTitle="DigiToken - Withdraw">
      <Header variant="v6" />
      <WithdrawBanner />
    </Layout>
  );
};

export default Withdraw;
